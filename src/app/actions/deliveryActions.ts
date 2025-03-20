"use server"

import { deliverySchema, DeliveryFormData, DeliveryData, ValidationErrors } from "@/lib/validations/delivery"
import { revalidatePath } from "next/cache"

// Define more precise return types
type SuccessResponse = {
  message: string
  errors: {}
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
      recipient: formData.get("recipient"),
      place: formData.get("place"),
      notes: formData.get("notes")
    })

    // Return validation errors if any
    if (!validatedFields.success) {
      return {
        message: "Invalid data. Check the fields and try again.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
        data: null
      }
    }

    const data: DeliveryFormData = validatedFields.data
    
    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock the database return object
    const mockDbData = {
      id: "del_" + Math.random().toString(36).substring(2, 9),
      recipientEmail: data.recipient,
      place: data.place,
      notes: data.notes,
      status: "pending",
      created_at: new Date().toISOString()
    }

    return {
      message: "Delivery registered successfully!",
      errors: {},
      success: true,
      data: mockDbData
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error saving delivery:", error)
    return {
      message: "An error occurred while saving the delivery.",
      errors: {},
      success: false,
      data: null
    }
  }
} 