import { z } from 'zod'

// Delivery validation schema
export const deliverySchema = z.object({
  recipient: z.string().trim().email('Invalid email address').min(1, 'Recipient email is required'),
  place: z.string().trim().min(1, 'Delivery place is required').max(100, 'Place must be less than 100 characters'),
  notes: z.string().trim().max(500, 'Notes must be less than 500 characters'),
})

export const validateDeliveryForm = (data: Partial<z.infer<typeof deliverySchema>>): { valid: boolean; errors: Record<string, string[] | string> } => {
  try {
    deliverySchema.parse(data)
    return { valid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.flatten().fieldErrors
      return {
        valid: false,
        errors: errors as Record<string, string | string[]>,
      }
    }
    return {
      valid: false,
      errors: { form: ['An unexpected error occurred'] },
    }
  }
}

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
