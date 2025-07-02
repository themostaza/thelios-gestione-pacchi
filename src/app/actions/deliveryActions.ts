'use server'

import { cookies } from 'next/headers'

import { getServerTranslation } from '@/i18n/serverTranslation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DeliveryFormData, SuccessResponse, ErrorResponse, DeliveryFilters, PaginatedDeliveriesResponse, DeliveryData, StatusUpdateResponse, ReminderLog } from '@/lib/types/delivery'
import { deliverySchema } from '@/lib/validations/delivery'

async function sendEmailWithRetry(
  deliveryId: string,
  recipientEmail: string,
  senderEmail: string,
  place: string,
  notes: string,
  createdAt: string,
  maxRetries: number = 3
): Promise<{ success: boolean; message: string; data?: ReminderLog }> {
  let lastError: string | null = null
  const subject = `Thelios - gestione pacchi #${deliveryId}`
  // Compose the XML body as required
  const xmlBody = `
    <n0:Z_SEND_EMAIL_BCS xmlns:n0="urn:sap-com:document:sap:rfc:functions">
      <IV_BODY>
        <item><LINE><![CDATA[ID: ${deliveryId}<br>]]></LINE></item>
        <item><LINE><![CDATA[Data di creazione: ${new Date(createdAt).toLocaleString()}<br>]]></LINE></item>
        <item><LINE><![CDATA[Email destinatario: ${recipientEmail}<br>]]></LINE></item>
        <item><LINE><![CDATA[Email mittente: ${senderEmail}<br>]]></LINE></item>
        <item><LINE><![CDATA[Luogo: ${place}<br>]]></LINE></item>
        <item><LINE><![CDATA[Note: ${notes || '/'}]]></LINE></item>
      </IV_BODY>
      <IV_EMAIL>${recipientEmail}</IV_EMAIL>
      <IV_SUBJECT>${subject}</IV_SUBJECT>
    </n0:Z_SEND_EMAIL_BCS>
  `
  const url = process.env.THELIOS_API_URL
  const AUTH = process.env.THELIOS_API_KEY
  const DISABLE_EMAIL_SEND = false // just for testing

  if (!AUTH) {
    throw new Error('Thelios API key is not set')
  }

  if (!url) {
    throw new Error('Thelios API URL is not set')
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (DISABLE_EMAIL_SEND) {
        console.log('[EMAIL MOCK] Subject:', subject)
        console.log('[EMAIL MOCK] XML Body:', xmlBody)
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            Authorization: AUTH,
          },
          body: xmlBody,
        })
        if (!response.ok) throw new Error(`API response error: ${response.status}`)
      }
      // Optionally, parse response text if needed
      const supabase = createClient(cookies())
      const translatedMessage = await getServerTranslation('notifications.initialNotificationSent')
      const message = translatedMessage.replace('{recipientEmail}', recipientEmail)
      const { data: reminder, error } = await supabase
        .from('reminder')
        .insert({
          delivery_id: deliveryId,
          ok: true,
          message: message,
          send_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return {
        success: true,
        message: message,
        data: reminder as ReminderLog,
      }
    } catch (error) {
      console.error('[EMAIL ERROR]', error)
      lastError = error instanceof Error ? error.message : 'Unknown error occurred'
      try {
        const supabase = createClient(cookies())
        await supabase.from('reminder').insert({
          delivery_id: deliveryId,
          ok: false,
          message: `Failed to send initial notification (attempt ${attempt}/${maxRetries}): ${lastError}`,
          send_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error('Failed to log email error:', logError)
      }
      if (attempt === maxRetries) {
        return {
          success: false,
          message: lastError,
        }
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  return {
    success: false,
    message: lastError || 'Failed to send email after all retries',
  }
}

export async function saveDelivery(formData: FormData): Promise<SuccessResponse | ErrorResponse> {
  try {
    const validatedFields = deliverySchema.safeParse({
      recipient: formData.get('recipient'),
      place: formData.get('place'),
      notes: formData.get('notes'),
    })

    if (!validatedFields.success) {
      return {
        message: 'Invalid data. Check the fields and try again.',
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
        data: null,
      }
    }

    const data: DeliveryFormData = validatedFields.data

    const supabase = createClient(cookies())

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        message: 'Authentication required. Please sign in to create a delivery.',
        errors: {},
        success: false,
        data: null,
      }
    }

    const { data: deliveryData, error } = await supabase
      .from('delivery')
      .insert({
        recipient_email: data.recipient,
        place: data.place,
        notes: data.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return {
        message: 'Database error: ' + error.message,
        errors: {},
        success: false,
        data: null,
      }
    }

    // Send initial notification email with retry logic
    const emailResult = await sendEmailWithRetry(deliveryData.id.toString(), data.recipient, user.email || 'unknown', data.place, data.notes, deliveryData.created_at)

    const savedDelivery: DeliveryData = {
      id: deliveryData.id,
      recipientEmail: deliveryData.recipient_email,
      place: deliveryData.place,
      notes: deliveryData.notes,
      status: deliveryData.status,
      created_at: deliveryData.created_at,
      completed_at: deliveryData.completed_at,
      user: {
        email: user.email || 'unknown',
      },
    }

    return {
      message: emailResult.success ? 'Delivery registered and notification sent successfully!' : 'Delivery registered but notification failed. You can try sending it again later.',
      errors: null,
      success: true,
      data: savedDelivery,
    }
  } catch (error) {
    console.error('Error saving delivery:', error)
    return {
      message: 'An error occurred while saving the delivery.',
      errors: {},
      success: false,
      data: null,
    }
  }
}

export async function getDeliveriesPaginated(page: number = 1, pageSize: number = 10, filters: DeliveryFilters = {}): Promise<PaginatedDeliveriesResponse> {
  try {
    if (filters.status && Array.isArray(filters.status) && filters.status.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No statuses selected',
        hasMore: false,
        count: 0,
      }
    }

    const supabase = createClient(cookies())

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        data: null,
        message: 'Authentication required. Please sign in to view deliveries.',
        hasMore: false,
      }
    }

    let query = supabase.from('delivery').select('*', { count: 'exact' })

    // All users can see all deliveries

    if (filters.userEmail) {
      const { data: userData } = await supabase.from('users').select('id').eq('email', filters.userEmail).single()

      if (userData) {
        query = query.eq('user_id', userData.id)
      }
    }

    if (filters.recipientEmail) {
      query = query.ilike('recipient_email', `%${filters.recipientEmail}%`)
    }

    if (filters.place) {
      query = query.ilike('place', `%${filters.place}%`)
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters.completed_at) {
      query = query.gte('completed_at', filters.completed_at)
    }

    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`
      query = query.or(`recipient_email.ilike.${term},place.ilike.${term},notes.ilike.${term}`)
    }

    query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

    const offset = (page - 1) * pageSize
    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error && error.message.includes('range')) {
      return {
        success: true,
        data: [],
        message: 'No more deliveries available',
        hasMore: false,
        count: count || 0,
      }
    }

    if (error) throw error

    const userIds = [...new Set(data.map((delivery) => delivery.user_id))].filter(Boolean)
    const userEmailMap = new Map<string, string>()

    if (userIds.length > 0) {
      try {
        const { data: profileData } = await supabase.from('profile').select('user_id, email').in('user_id', userIds)

        if (profileData && profileData.length > 0) {
          profileData.forEach((profile) => {
            userEmailMap.set(profile.user_id, profile.email || 'Unknown')
          })
        }
      } catch (profileError) {
        console.error('Error fetching profiles:', profileError)
      }
    }

    const deliveries: DeliveryData[] = data.map((delivery) => {
      let userEmail = 'Unknown'

      if (userEmailMap.has(delivery.user_id)) {
        userEmail = userEmailMap.get(delivery.user_id) || 'Unknown'
      } else if (delivery.user_id === user.id) {
        userEmail = user.email || 'Current user'
      }

      return {
        id: delivery.id,
        recipientEmail: delivery.recipient_email,
        place: delivery.place,
        notes: delivery.notes,
        status: delivery.status,
        created_at: delivery.created_at,
        completed_at: delivery.completed_at,
        user: {
          email: userEmail,
        },
      }
    })

    const hasMore = Boolean(count && count > offset + data.length)

    return {
      success: true,
      data: deliveries,
      message: 'Deliveries retrieved successfully',
      hasMore,
      count,
    }
  } catch (error) {
    console.error('Unexpected error fetching deliveries:', error)
    return {
      success: false,
      data: null,
      message: 'An unexpected error occurred while fetching deliveries.',
      hasMore: false,
    }
  }
}

export async function getDeliveryById(id: string) {
  try {
    const supabase = createClient(cookies())

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: 'Authentication required. Please sign in to view delivery details.',
        data: null,
      }
    }

    const query = supabase.from('delivery').select('*')

    // All users can see all deliveries

    const { data: delivery, error } = await query.eq('id', id).single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        message: error.message || 'Failed to fetch delivery',
        data: null,
      }
    }

    if (!delivery) {
      return {
        success: false,
        message: 'Delivery not found',
        data: null,
      }
    }

    let userEmail = 'Unknown'

    try {
      const { data: profileData } = await supabase.from('profile').select('email').eq('user_id', delivery.user_id).single()

      if (profileData) {
        userEmail = profileData.email || 'Unknown'
      } else if (delivery.user_id === user.id) {
        userEmail = user.email || 'Current user'
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    const deliveryData: DeliveryData = {
      id: delivery.id,
      recipientEmail: delivery.recipient_email,
      place: delivery.place,
      notes: delivery.notes,
      status: delivery.status,
      created_at: delivery.created_at,
      completed_at: delivery.completed_at,
      user: {
        email: userEmail,
      },
    }

    return {
      success: true,
      message: 'Delivery fetched successfully',
      data: deliveryData,
    }
  } catch (error) {
    console.error('Error fetching delivery:', error)
    return {
      success: false,
      message: 'An unexpected error occurred while fetching the delivery.',
      data: null,
    }
  }
}

export async function updateDeliveryStatus(id: string, status: string): Promise<StatusUpdateResponse> {
  try {
    const supabase = createClient(cookies())

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: 'Authentication required. Please sign in to update delivery status.',
        data: null,
      }
    }

    // Check if user is admin directly - handle multiple rows gracefully
    let isAdmin = false
    try {
      console.log('Checking admin status for user:', user.id, user.email)

      const { data: profileData, error: profileError } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()

      console.log('Profile data:', profileData, 'Error:', profileError)

      if (!profileError && profileData) {
        isAdmin = profileData.is_admin || false
      }

      console.log('Final isAdmin value:', isAdmin)
    } catch (error) {
      console.error('Error checking admin status:', error)
      isAdmin = false
    }

    const { data: delivery, error: fetchError } = await supabase.from('delivery').select('*').eq('id', id).single()

    if (fetchError || !delivery) {
      return {
        success: false,
        message: fetchError?.message || 'Delivery not found',
        data: null,
      }
    }

    // Check permissions: admins can modify any delivery, users can only modify their own non-finalized deliveries
    const isDeliveryFinalized = delivery.status === 'completed' || delivery.status === 'cancelled'
    const isOwner = delivery.user_id === user.id

    console.log('Permission check:', {
      isAdmin,
      isOwner,
      isDeliveryFinalized,
      deliveryUserId: delivery.user_id,
      currentUserId: user.id,
      deliveryStatus: delivery.status,
    })

    if (!isAdmin && (!isOwner || isDeliveryFinalized)) {
      console.log('Permission denied')
      return {
        success: false,
        message: isDeliveryFinalized ? 'Only admins can modify finalized deliveries' : 'You do not have permission to update this delivery',
        data: null,
      }
    }

    console.log('Permission granted, proceeding with update')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status }

    if (status === 'completed' || status === 'cancelled') {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    console.log('Update data:', updateData, 'Delivery ID:', id)

    // First, verify the delivery exists
    const { data: existingDelivery, error: verifyError } = await supabase.from('delivery').select('*').eq('id', id).single()

    if (verifyError || !existingDelivery) {
      console.log('Delivery not found:', verifyError)
      return {
        success: false,
        message: 'Delivery not found',
        data: null,
      }
    }

    console.log('Existing delivery found:', existingDelivery)

    // Perform the update - convert id to number if needed
    const deliveryId = parseInt(id, 10)
    console.log('Converting delivery ID:', id, 'to:', deliveryId)

    // Test if we can update this delivery by trying a simple update first
    const { data: testUpdate, error: testError } = await supabase
      .from('delivery')
      .update({ notes: existingDelivery.notes }) // Update with same value
      .eq('id', deliveryId)
      .select('id')

    console.log('Test update result:', testUpdate, 'Test error:', testError)

    // First try update without select to see if it works
    let updateResult, updateError

    if (isAdmin) {
      // For admins, use service role to bypass RLS
      const serviceSupabase = createAdminClient()

      const { data, error } = await serviceSupabase.from('delivery').update(updateData).eq('id', deliveryId).select('id')

      updateResult = data
      updateError = error

      console.log('Admin update with service role:', { updateResult, updateError })
    } else {
      // For regular users, use normal client
      const { data, error } = await supabase.from('delivery').update(updateData).eq('id', deliveryId).select('id')

      updateResult = data
      updateError = error
    }

    console.log('Update result:', updateResult, 'Update error (without select):', updateError)

    if (updateError) {
      console.log('Update error:', updateError)
      return {
        success: false,
        message: updateError.message || 'Failed to update delivery status',
        data: null,
      }
    }

    // Now fetch the updated delivery
    const { data: updatedDelivery, error: fetchUpdatedError } = await supabase.from('delivery').select('*').eq('id', deliveryId).single()

    console.log('Fetch updated delivery result:', { updatedDelivery, fetchUpdatedError })

    if (fetchUpdatedError) {
      console.log('Fetch error:', fetchUpdatedError)
      return {
        success: false,
        message: 'Update successful but failed to fetch updated data',
        data: null,
      }
    }

    let userEmail = 'Unknown'
    try {
      const { data: profileData } = await supabase.from('profile').select('email').eq('user_id', updatedDelivery.user_id).single()

      if (profileData) {
        userEmail = profileData.email || 'Unknown'
      } else if (updatedDelivery.user_id === user.id) {
        userEmail = user.email || 'Current user'
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    const deliveryData: DeliveryData = {
      id: updatedDelivery.id,
      recipientEmail: updatedDelivery.recipient_email,
      place: updatedDelivery.place,
      notes: updatedDelivery.notes,
      status: updatedDelivery.status,
      created_at: updatedDelivery.created_at,
      completed_at: updatedDelivery.completed_at,
      user: {
        email: userEmail,
      },
    }

    return {
      success: true,
      message: 'Delivery status updated successfully',
      data: deliveryData,
    }
  } catch (error) {
    console.error('Error updating delivery status:', error)
    return {
      success: false,
      message: 'An unexpected error occurred while updating the delivery status.',
      data: null,
    }
  }
}

export async function sendReminderEmail(deliveryId: string) {
  try {
    // Recupera la delivery completa per ottenere tutti i dati necessari
    const deliveryResult = await getDeliveryById(deliveryId)
    if (!deliveryResult.success || !deliveryResult.data) {
      throw new Error('Delivery not found')
    }
    const delivery = deliveryResult.data
    // Usa la stessa funzione di invio email della creazione
    return await sendEmailWithRetry(delivery.id.toString(), delivery.recipientEmail, delivery.user.email, delivery.place, delivery.notes, delivery.created_at)
  } catch (error) {
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    try {
      const supabase = createClient(cookies())
      const { data: reminder, error: logError } = await supabase
        .from('reminder')
        .insert({
          delivery_id: deliveryId,
          ok: false,
          message: `Failed to send reminder: ${errorMessage}`,
          send_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (logError) throw logError
      return {
        success: false,
        message: errorMessage,
        data: reminder as ReminderLog,
      }
    } catch (dbError) {
      console.error('Failed to log reminder error:', dbError)
      return {
        success: false,
        message: errorMessage,
      }
    }
  }
}

export async function getDeliveryReminders(deliveryId: string) {
  try {
    const supabase = createClient(cookies())
    const { data: reminders, error } = await supabase.from('reminder').select('*').eq('delivery_id', deliveryId).order('send_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: reminders as ReminderLog[],
    }
  } catch (error) {
    console.error('Failed to fetch reminders:', error)
    return {
      success: false,
      message: 'Failed to load reminder history',
      data: [],
    }
  }
}
