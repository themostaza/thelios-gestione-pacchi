'use server'

import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'
import { deliverySchema, DeliveryFormData, ValidationErrors } from '@/lib/validations/delivery'
import { iAmAdmin } from '@/actions/admin'

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

// Type for the returned deliveries
type GetDeliveriesResponse = {
  success: boolean
  data: DeliveryData[] | null
  message: string
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
        user_id: user.id
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
      }
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
        delete filters.userEmail;
      }
    }

    // Apply filters
    if (filters.userEmail && isAdmin) {
      // Add ability to filter by specific user's email if needed
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', filters.userEmail)
        .single()
      
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
    const userIds = [...new Set(data.map(delivery => delivery.user_id))].filter(Boolean)
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
          profileData.forEach(profile => {
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
          email: userEmail
        }
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

// Add this to your deliveryActions.ts file
export async function getDeliveryById(id: string) {
  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch delivery',
        data: null,
      }
    }

    return {
      success: true,
      message: 'Delivery fetched successfully',
      data: data,
    }
  } catch (error) {
    console.error('Error fetching delivery:', error)
    return {
      success: false,
      message: 'Error fetching delivery',
      data: null,
    }
  }
}
