'use server'

import { cookies } from 'next/headers'

import { getServerTranslation } from '@/i18n/serverTranslation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DeliveryFormData, SuccessResponse, ErrorResponse, DeliveryFilters, PaginatedDeliveriesResponse, DeliveryData, StatusUpdateResponse, ReminderLog } from '@/lib/types/delivery'
import { deliverySchema } from '@/lib/validations/delivery'

type EmailType = 'initial' | 'completion' | 'cancellation' | 'reminder'

interface EmailTemplateData {
  deliveryId: string
  recipientEmail: string
  senderEmail: string
  place: string
  notes: string
  createdAt: string
  completedAt?: string
  recipientName?: string
  timeSlot?: string
}

function generateEmailSubject(emailType: EmailType, deliveryId: string): string {
  switch (emailType) {
    case 'initial':
      return `Nuova consegna - Tracking ${deliveryId}`
    case 'completion':
      return `Consegna completata - Tracking ${deliveryId}`
    case 'cancellation':
      return `Consegna annullata - Tracking ${deliveryId}`
    case 'reminder':
      return `Promemoria ritiro - Tracking ${deliveryId}`
    default:
      return `Thelios - gestione pacchi #${deliveryId}`
  }
}

function generateEmailBody(emailType: EmailType, data: EmailTemplateData): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  switch (emailType) {
    case 'initial':
      return `
        <item><LINE><![CDATA[La tua consegna è pronta per il ritiro.<br>]]></LINE></item>
        <item><LINE><![CDATA[Ti preghiamo di effettuare il ritiro al più presto per agevolare le operazioni di smistamento.<br><br>]]></LINE></item>
        <item><LINE><![CDATA[Tracking: ${data.deliveryId}<br>]]></LINE></item>
        <item><LINE><![CDATA[Data prevista: ${formatDateOnly(data.createdAt)}<br>]]></LINE></item>
        ${data.timeSlot ? `<item><LINE><![CDATA[Fascia oraria: ${data.timeSlot}<br>]]></LINE></item>` : ''}
        <item><LINE><![CDATA[Indirizzo: ${data.place}<br>]]></LINE></item>
        ${data.notes ? `<item><LINE><![CDATA[Note: ${data.notes}<br>]]></LINE></item>` : ''}
        <item><LINE><![CDATA[<br>]]></LINE></item>
        <item><LINE><![CDATA[Per segnalazioni, rivolgiti all'ufficio competente.<br>]]></LINE></item>
        <item><LINE><![CDATA[Ti auguriamo buona giornata.<br>]]></LINE></item>
        <item><LINE><![CDATA[________________________<br>]]></LINE></item>
        <item><LINE><![CDATA[Questa è una mail automatica. Non rispondere a questo messaggio.]]></LINE></item>
      `

    case 'completion':
      return `
        <item><LINE><![CDATA[La presente per confermarti il completamento della consegna.<br><br>]]></LINE></item>
        <item><LINE><![CDATA[Tracking: ${data.deliveryId}<br>]]></LINE></item>
        <item><LINE><![CDATA[Data: ${formatDate(data.completedAt || new Date().toISOString())}<br>]]></LINE></item>
        <item><LINE><![CDATA[Indirizzo: ${data.place}<br>]]></LINE></item>
        ${data.notes ? `<item><LINE><![CDATA[Note: ${data.notes}<br>]]></LINE></item>` : ''}
        <item><LINE><![CDATA[Consegnato a: ${data.recipientName || 'Destinatario'}<br><br>]]></LINE></item>
        <item><LINE><![CDATA[Per segnalazioni, rivolgiti all'ufficio competente.<br>]]></LINE></item>
        <item><LINE><![CDATA[Ti auguriamo buona giornata.<br>]]></LINE></item>
        <item><LINE><![CDATA[________________________<br>]]></LINE></item>
        <item><LINE><![CDATA[Questa è una mail automatica. Non rispondere a questo messaggio.]]></LINE></item>
      `

    case 'cancellation':
      return `
        <item><LINE><![CDATA[La consegna del tuo pacco è stata annullata.<br><br>]]></LINE></item>
        <item><LINE><![CDATA[Tracking: ${data.deliveryId}<br>]]></LINE></item>
        <item><LINE><![CDATA[Data annullamento: ${formatDate(data.completedAt || new Date().toISOString())}<br>]]></LINE></item>
        <item><LINE><![CDATA[Indirizzo: ${data.place}<br>]]></LINE></item>
        ${data.notes ? `<item><LINE><![CDATA[Note: ${data.notes}<br><br>]]></LINE></item>` : ''}
        <item><LINE><![CDATA[Per segnalazioni, rivolgiti all'ufficio competente.<br>]]></LINE></item>
        <item><LINE><![CDATA[Ti auguriamo buona giornata.<br>]]></LINE></item>
        <item><LINE><![CDATA[________________________<br>]]></LINE></item>
        <item><LINE><![CDATA[Questa è una mail automatica. Non rispondere a questo messaggio.]]></LINE></item>
      `

    case 'reminder':
      return `
        <item><LINE><![CDATA[Ti ricordiamo che la tua consegna è pronta per il ritiro.<br>]]></LINE></item>
        <item><LINE><![CDATA[Ti preghiamo di effettuare il ritiro al più presto per agevolare le operazioni di smistamento.<br><br>]]></LINE></item>
        <item><LINE><![CDATA[Tracking: ${data.deliveryId}<br>]]></LINE></item>
        <item><LINE><![CDATA[Data prevista: ${formatDateOnly(data.createdAt)}<br>]]></LINE></item>
        ${data.timeSlot ? `<item><LINE><![CDATA[Fascia oraria: ${data.timeSlot}<br>]]></LINE></item>` : ''}
        <item><LINE><![CDATA[Indirizzo: ${data.place}<br>]]></LINE></item>
        ${data.notes ? `<item><LINE><![CDATA[Note: ${data.notes}<br>]]></LINE></item>` : ''}
        <item><LINE><![CDATA[<br>]]></LINE></item>
        <item><LINE><![CDATA[Per segnalazioni, rivolgiti all'ufficio competente.<br>]]></LINE></item>
        <item><LINE><![CDATA[Ti auguriamo buona giornata.<br>]]></LINE></item>
        <item><LINE><![CDATA[________________________<br>]]></LINE></item>
        <item><LINE><![CDATA[Questa è una mail automatica. Non rispondere a questo messaggio.]]></LINE></item>
      `

    default:
      return `
        <item><LINE><![CDATA[ID: ${data.deliveryId}<br>]]></LINE></item>
        <item><LINE><![CDATA[Data di creazione: ${formatDate(data.createdAt)}<br>]]></LINE></item>
        <item><LINE><![CDATA[Email destinatario: ${data.recipientEmail}<br>]]></LINE></item>
        <item><LINE><![CDATA[Email mittente: ${data.senderEmail}<br>]]></LINE></item>
        <item><LINE><![CDATA[Luogo: ${data.place}<br>]]></LINE></item>
        <item><LINE><![CDATA[Note: ${data.notes || '/'}]]></LINE></item>
      `
  }
}

async function sendEmailWithRetry(emailType: EmailType, data: EmailTemplateData, maxRetries: number = 1): Promise<{ success: boolean; message: string; data?: ReminderLog }> {
  let lastError: string | null = null
  const subject = generateEmailSubject(emailType, data.deliveryId)
  const emailBody = generateEmailBody(emailType, data)

  // Compose the XML body as required
  const xmlBody = `
    <n0:Z_SEND_EMAIL_BCS xmlns:n0="urn:sap-com:document:sap:rfc:functions">
      <IV_BODY>
        ${emailBody}
      </IV_BODY>
      <IV_EMAIL>${data.recipientEmail}</IV_EMAIL>
      <IV_SUBJECT>${subject}</IV_SUBJECT>
    </n0:Z_SEND_EMAIL_BCS>
  `
  const url = process.env.THELIOS_API_SEND_MAIL_URL
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

      let translatedMessage: string
      switch (emailType) {
        case 'initial':
          translatedMessage = await getServerTranslation('notifications.initialNotificationSent')
          break
        case 'completion':
          translatedMessage = await getServerTranslation('notifications.completionNotificationSent')
          break
        case 'cancellation':
          translatedMessage = await getServerTranslation('notifications.cancellationNotificationSent')
          break
        default:
          translatedMessage = await getServerTranslation('notifications.initialNotificationSent')
      }

      const message = translatedMessage.replace('{recipientEmail}', data.recipientEmail)
      const { data: reminder, error } = await supabase
        .from('reminder')
        .insert({
          delivery_id: data.deliveryId,
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
          delivery_id: data.deliveryId,
          ok: false,
          message: `Failed to send ${emailType} notification (attempt ${attempt}/${maxRetries}): ${lastError}`,
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
    const emailResult = await sendEmailWithRetry('initial', {
      deliveryId: deliveryData.id.toString(),
      recipientEmail: data.recipient,
      senderEmail: user.email || 'unknown',
      place: data.place,
      notes: data.notes,
      createdAt: deliveryData.created_at,
    })

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
      const { data: profileData, error: profileError } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (!profileError && profileData) {
        isAdmin = profileData.is_admin || false
      }
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

    if (!isAdmin && (!isOwner || isDeliveryFinalized)) {
      return {
        success: false,
        message: isDeliveryFinalized ? 'Only admins can modify finalized deliveries' : 'You do not have permission to update this delivery',
        data: null,
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status }

    if (status === 'completed' || status === 'cancelled') {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    // First, verify the delivery exists
    const { data: existingDelivery, error: verifyError } = await supabase.from('delivery').select('*').eq('id', id).single()

    if (verifyError || !existingDelivery) {
      return {
        success: false,
        message: 'Delivery not found',
        data: null,
      }
    }

    // Perform the update - convert id to number if needed
    const deliveryId = parseInt(id, 10)

    // Test if we can update this delivery by trying a simple update first
    await supabase
      .from('delivery')
      .update({ notes: existingDelivery.notes }) // Update with same value
      .eq('id', deliveryId)
      .select('id')

    // First try update without select to see if it works
    let updateError

    if (isAdmin) {
      // For admins, use service role to bypass RLS
      const serviceSupabase = createAdminClient()

      const { error } = await serviceSupabase.from('delivery').update(updateData).eq('id', deliveryId).select('id')

      updateError = error
    } else {
      // For regular users, use normal client
      const { error } = await supabase.from('delivery').update(updateData).eq('id', deliveryId).select('id')

      updateError = error
    }

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update delivery status',
        data: null,
      }
    }

    // Now fetch the updated delivery
    const { data: updatedDelivery, error: fetchUpdatedError } = await supabase.from('delivery').select('*').eq('id', deliveryId).single()

    if (fetchUpdatedError) {
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

export async function sendStatusEmail(deliveryId: string, emailType: 'completion' | 'cancellation') {
  try {
    // Recupera la delivery completa per ottenere tutti i dati necessari
    const deliveryResult = await getDeliveryById(deliveryId)
    if (!deliveryResult.success || !deliveryResult.data) {
      throw new Error('Delivery not found')
    }
    const delivery = deliveryResult.data

    // Get user email
    const supabase = createClient(cookies())
    let userEmail = 'Unknown'
    try {
      // Get the delivery with user_id from database
      const { data: deliveryWithUser, error: fetchError } = await supabase.from('delivery').select('user_id').eq('id', deliveryId).single()

      if (!fetchError && deliveryWithUser) {
        const { data: profileData } = await supabase.from('profile').select('email').eq('user_id', deliveryWithUser.user_id).single()
        if (profileData) {
          userEmail = profileData.email || 'Unknown'
        }
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    return await sendEmailWithRetry(emailType, {
      deliveryId: delivery.id.toString(),
      recipientEmail: delivery.recipientEmail,
      senderEmail: userEmail,
      place: delivery.place,
      notes: delivery.notes,
      createdAt: delivery.created_at,
      completedAt: delivery.completed_at || undefined,
    })
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
          message: `Failed to send ${emailType} notification: ${errorMessage}`,
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
      console.error('Failed to log status email error:', dbError)
      return {
        success: false,
        message: errorMessage,
      }
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
    return await sendEmailWithRetry('reminder', {
      deliveryId: delivery.id.toString(),
      recipientEmail: delivery.recipientEmail,
      senderEmail: delivery.user.email,
      place: delivery.place,
      notes: delivery.notes,
      createdAt: delivery.created_at,
    })
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

export async function sendAutomaticReminders() {
  try {
    const supabase = createClient(cookies())

    // Get all pending deliveries that haven't received a reminder in the last 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: pendingDeliveries, error: fetchError } = await supabase
      .from('delivery')
      .select(
        `
        id,
        recipient_email,
        place,
        notes,
        created_at,
        status,
        user_id
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching pending deliveries:', fetchError)
      return {
        success: false,
        message: 'Failed to fetch pending deliveries',
        data: null,
      }
    }

    if (!pendingDeliveries || pendingDeliveries.length === 0) {
      return {
        success: true,
        message: 'No pending deliveries found',
        data: { sent: 0, total: 0 },
      }
    }

    let sentCount = 0
    const results = []

    for (const delivery of pendingDeliveries) {
      try {
        // Check if a reminder was sent in the last 3 days
        const { data: recentReminders, error: reminderError } = await supabase
          .from('reminder')
          .select('send_at')
          .eq('delivery_id', delivery.id)
          .gte('send_at', threeDaysAgo.toISOString())
          .order('send_at', { ascending: false })
          .limit(1)

        if (reminderError) {
          console.error(`Error checking reminders for delivery ${delivery.id}:`, reminderError)
          continue
        }

        // If no recent reminders, send one
        if (!recentReminders || recentReminders.length === 0) {
          // Get user email
          let userEmail = 'Unknown'
          try {
            const { data: profileData } = await supabase.from('profile').select('email').eq('user_id', delivery.user_id).single()
            if (profileData) {
              userEmail = profileData.email || 'Unknown'
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError)
          }

          const emailResult = await sendEmailWithRetry('reminder', {
            deliveryId: delivery.id.toString(),
            recipientEmail: delivery.recipient_email,
            senderEmail: userEmail,
            place: delivery.place,
            notes: delivery.notes,
            createdAt: delivery.created_at,
          })

          if (emailResult.success) {
            sentCount++
            results.push({
              deliveryId: delivery.id,
              recipientEmail: delivery.recipient_email,
              success: true,
              message: emailResult.message,
            })
          } else {
            results.push({
              deliveryId: delivery.id,
              recipientEmail: delivery.recipient_email,
              success: false,
              message: emailResult.message,
            })
          }
        }
      } catch (error) {
        console.error(`Error processing delivery ${delivery.id}:`, error)
        results.push({
          deliveryId: delivery.id,
          recipientEmail: delivery.recipient_email,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      success: true,
      message: `Automatic reminders sent: ${sentCount}/${pendingDeliveries.length}`,
      data: {
        sent: sentCount,
        total: pendingDeliveries.length,
        results,
      },
    }
  } catch (error) {
    console.error('Error sending automatic reminders:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
    }
  }
}
