import { z } from "zod"

// Shared schema definition
export const deliverySchema = z.object({
  recipient: z.string()
    .min(1, "Recipient required")
    .superRefine((val, ctx) => {
      if (val.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid recipient",
        });
      }
    }),
  place: z.string(),
  notes: z.string()
})

// Explicit type definition derived from schema
export type DeliveryFormData = z.infer<typeof deliverySchema>

// Database response type
export type DeliveryData = {
  id: string
  recipientEmail: string
  place: string
  notes: string
  status: string
  created_at: string
}

// Better error type definition - restrict to form field names
export type ValidationErrors = {
  [K in keyof DeliveryFormData]?: string[] | string;
} & {
  form?: string[];
}

// Action state type
export type DeliveryActionState = {
  message: string
  errors: ValidationErrors
  success: boolean
  data: DeliveryData | null
}

// Recipient type definition
export type Recipient = {
  name: string
  surname: string
  email: string
}

// Validation result type
export type ValidationResult = {
  valid: boolean
  errors: ValidationErrors
}

// Shared validation function
export const validateDeliveryForm = (data: Partial<DeliveryFormData>): ValidationResult => {
  try {
    deliverySchema.parse(data)
    return { valid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.flatten().fieldErrors as ValidationErrors
      return { 
        valid: false, 
        errors 
      }
    }
    return { 
      valid: false, 
      errors: { form: ["An unexpected error occurred"] } 
    }
  }
} 