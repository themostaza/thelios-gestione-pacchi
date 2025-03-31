'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { registerUser } from '@/app/actions/authActions'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onLoginClick?: () => void
  hideButtons?: boolean
  tabName?: string
}

export default function RegisterForm({ onLoginClick, hideButtons = false, tabName = "register" }: RegisterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)

    try {
      const result = await registerUser(data.email, data.password)

      if (result.success) {
        toast({
          title: 'Registration complete',
          description: result.message,
        })
        form.reset()

        // Redirect after brief pause
        setTimeout(() => {
          router.refresh()
          if (onLoginClick) {
            onLoginClick() // Switch to login tab
          } else {
            router.push('/auth') // Or redirect to login page
          }
        }, 2000)
      } else {
        toast({
          title: 'Registration failed',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error during registration:', error)
      toast({
        title: 'Unexpected error',
        description: 'An unexpected error occurred during registration.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-tab={tabName}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden submit button for triggering from parent */}
          <button type="submit" style={{ display: 'none' }}></button>

          {/* Only show buttons if not hidden */}
          {!hideButtons && (
            <div className="flex flex-col space-y-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus size={20} className="mr-2" />
                )}
                Register
              </Button>
              
              {onLoginClick && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLoginClick}
                  className="w-full"
                >
                  Already have an account? Sign in
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </>
  )
} 