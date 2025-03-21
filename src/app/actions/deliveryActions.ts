'use server'

import { deliverySchema, DeliveryFormData, DeliveryData, ValidationErrors } from '@/lib/validations/delivery'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        message: 'Authentication required. Please sign in to create a delivery.',
        errors: {},
        success: false,
        data: null,
      }
    }
    // Insert data into the delivery table with user_id
    const { data: deliveryData, error } = await supabase
      .from('delivery')
      .insert({
        recipient_email: data.recipient,
        place: data.place,
        notes: data.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        user_id: user.id, // Use the authenticated user ID
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
    
    // Format the response data
    const savedDelivery: DeliveryData = {
      id: deliveryData.id,
      recipientEmail: deliveryData.recipient_email,
      place: deliveryData.place,
      notes: deliveryData.notes,
      status: deliveryData.status,
      created_at: deliveryData.created_at,
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
