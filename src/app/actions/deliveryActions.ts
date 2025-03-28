'use server'

import { cookies } from 'next/headers'

import { iAmAdmin } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { deliverySchema, DeliveryFormData, ValidationErrors } from '@/lib/validations/delivery'

// Define more precise return types
type SuccessResponse = {
  message: string
  errors: null
  success: true
  data: DeliveryData
}

type ErrorResponse = {
  message: string
  errors: ValidationErrors
  success: false
  data: null
}

// Type for filter options
export type DeliveryFilters = {
  recipientEmail?: string
  place?: string
  status?: string | string[]
  startDate?: string
  endDate?: string
  searchTerm?: string
  userEmail?: string
}

// Type for paginated response
export type PaginatedDeliveriesResponse = {
  success: boolean
  data: DeliveryData[] | null
  message: string
  hasMore: boolean
  count?: number | null
}

// Update the DeliveryData type to include a user object
export type DeliveryData = {
  id: number
  recipientEmail: string
  place: string
  notes: string | null
  status: string
  created_at: string
  user: {
    email: string
    // Future fields can be added here (name, avatar, etc.)
  }
}

// Type for status update response
export type StatusUpdateResponse = {
  success: boolean
  message: string
  data: DeliveryData | null
}

export type ReminderLog = {
  id: string
  delivery_id: string
  ok: boolean
  message: string
  send_at: string | Date
}

// Server action to save delivery data
export async function saveDelivery(formData: FormData): Promise<SuccessResponse | ErrorResponse> {
  try {
    // Parse and validate the form data on the server
    const validatedFields = deliverySchema.safeParse({
      recipient: formData.get('recipient'),
      place: formData.get('place'),
      notes: formData.get('notes'),
    })

    // Return validation errors if any
    if (!validatedFields.success) {
      return {
        message: 'Invalid data. Check the fields and try again.',
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
        data: null,
      }
    }

    const data: DeliveryFormData = validatedFields.data
    // Initialize Supabase client
    const supabase = createClient(cookies())

    // Get authenticated user - more secure than getSession()
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
    // Insert data into the delivery table with only user_id, no user_email
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

    // Format the response data with the user object
    const savedDelivery: DeliveryData = {
      id: deliveryData.id,
      recipientEmail: deliveryData.recipient_email,
      place: deliveryData.place,
      notes: deliveryData.notes,
      status: deliveryData.status,
      created_at: deliveryData.created_at,
      user: {
        email: user.email || 'unknown',
      },
    }

    return {
      message: 'Delivery registered successfully!',
      errors: null,
      success: true,
      data: savedDelivery,
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error('Error saving delivery:', error)
    return {
      message: 'An error occurred while saving the delivery.',
      errors: {},
      success: false,
      data: null,
    }
  }
}

// Server action to get deliveries with pagination and filters
export async function getDeliveriesPaginated(page: number = 1, pageSize: number = 10, filters: DeliveryFilters = {}): Promise<PaginatedDeliveriesResponse> {
  try {
    // Initialize Supabase client
    const supabase = createClient(cookies())

    // Get authenticated user
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

    // Start building the query
    let query = supabase.from('delivery').select('*', { count: 'exact' })

    // Check if user is admin
    const isAdmin = await iAmAdmin()

    // If not admin, only show their own deliveries
    if (!isAdmin) {
      query = query.eq('user_id', user.id)

      // Explicitly ignore userEmail filter for non-admins
      if (filters.userEmail) {
        // Remove the userEmail filter for non-admins
        delete filters.userEmail
      }
    }

    // Apply filters
    if (filters.userEmail && isAdmin) {
      // Add ability to filter by specific user's email if needed
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

    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`
      query = query.or(`recipient_email.ilike.${term},place.ilike.${term},notes.ilike.${term}`)
    }

    // First sort by creation date (newest first), then by ID for consistent pagination
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

    // Apply pagination
    const offset = (page - 1) * pageSize
    const { data, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) throw error

    // Create a map to efficiently look up user emails
    const userIds = [...new Set(data.map((delivery) => delivery.user_id))].filter(Boolean)
    const userEmailMap = new Map<string, string>()

    // If there are user IDs to look up
    if (userIds.length > 0) {
      // Look up user emails directly in the profile table
      try {
        const { data: profileData } = await supabase
          .from('profile') // Using 'profile' table (singular) as indicated
          .select('user_id, email')
          .in('user_id', userIds)

        console.log('profileData', profileData)

        if (profileData && profileData.length > 0) {
          profileData.forEach((profile) => {
            userEmailMap.set(profile.user_id, profile.email || 'Unknown')
          })
        }
      } catch (profileError) {
        console.error('Error fetching profiles:', profileError)
      }
    }

    // Map deliveries to the desired format
    const deliveries: DeliveryData[] = data.map((delivery) => {
      // Get user email from the map, or fallback to current user if it matches
      let userEmail = 'Unknown'

      if (userEmailMap.has(delivery.user_id)) {
        userEmail = userEmailMap.get(delivery.user_id) || 'Unknown'
      } else if (delivery.user_id === user.id) {
        // Fallback for current user
        userEmail = user.email || 'Current user'
      }

      return {
        id: delivery.id,
        recipientEmail: delivery.recipient_email,
        place: delivery.place,
        notes: delivery.notes,
        status: delivery.status,
        created_at: delivery.created_at,
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

// Replace the current getDeliveryById implementation with this:
export async function getDeliveryById(id: string) {
  try {
    // Initialize Supabase client
    const supabase = createClient(cookies())

    // Get authenticated user
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

    // Check if user is admin
    const isAdmin = await iAmAdmin()

    // Build the query - fixed to maintain proper type
    const query = supabase.from('delivery').select('*')

    // Apply filters with proper chaining
    if (!isAdmin) {
      query.eq('user_id', user.id)
    }

    // Add the id filter and execute
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

    // Get the user email
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

    // Format the response data
    const deliveryData: DeliveryData = {
      id: delivery.id,
      recipientEmail: delivery.recipient_email,
      place: delivery.place,
      notes: delivery.notes,
      status: delivery.status,
      created_at: delivery.created_at,
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
    // Initialize Supabase client
    const supabase = createClient(cookies())

    // Get authenticated user
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

    // Check if user is admin
    const isAdmin = await iAmAdmin()

    // Build the query to get the delivery first
    const { data: delivery, error: fetchError } = await supabase.from('delivery').select('*').eq('id', id).single()

    if (fetchError || !delivery) {
      return {
        success: false,
        message: fetchError?.message || 'Delivery not found',
        data: null,
      }
    }

    // Check permissions: only admin or the delivery creator can update status
    if (!isAdmin && delivery.user_id !== user.id) {
      return {
        success: false,
        message: 'You do not have permission to update this delivery',
        data: null,
      }
    }

    // Update the delivery status
    const { data: updatedDelivery, error: updateError } = await supabase.from('delivery').update({ status }).eq('id', id).select().single()

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update delivery status',
        data: null,
      }
    }

    // Get user email for response
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

    // Format the response data
    const deliveryData: DeliveryData = {
      id: updatedDelivery.id,
      recipientEmail: updatedDelivery.recipient_email,
      place: updatedDelivery.place,
      notes: updatedDelivery.notes,
      status: updatedDelivery.status,
      created_at: updatedDelivery.created_at,
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

export async function sendReminderEmail(deliveryId: string, recipientEmail: string) {
  try {
    // Initialize Supabase client
    const supabase = createClient(cookies())

    // Simuliamo un ritardo di invio
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In un caso reale, invieresti effettivamente l'email qui

    // Salva il reminder nel database
    const { data: reminder, error } = await supabase
      .from('reminder')
      .insert({
        delivery_id: deliveryId,
        ok: true,
        message: `Reminder sent to ${recipientEmail}`,
        send_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: reminder as ReminderLog,
    }
  } catch (error) {
    // Salva anche gli errori nel database
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
