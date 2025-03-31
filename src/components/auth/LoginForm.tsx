'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { loginUser } from '@/app/actions/authActions'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/context/authContext'
import { toast } from '@/hooks/use-toast'

// Login schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onRegisterClick?: () => void
  hideButtons?: boolean
  tabName?: string
}

export default function LoginForm({ onRegisterClick, hideButtons = false, tabName = "login" }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { updateAuthState } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)

    try {
      const result = await loginUser(data)

      if (!result.success) {
        toast({
          title: 'Authentication failed',
          description: result.error || 'The email or password you entered is incorrect. Please try again.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Success - update auth state and redirect to dashboard
      await updateAuthState()

      toast({
        title: 'Login successful',
        description: 'Redirecting to dashboard...',
      })

      setTimeout(() => {
        router.refresh()
        router.push('/deliveries')
      }, 800)
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred during login. Please try again.',
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
                    autoComplete="current-password"
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
                  <LogIn size={20} className="mr-2" />
                )}
                Sign in
              </Button>
              
              {onRegisterClick && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRegisterClick}
                  className="w-full"
                >
                  Don't have an account? Register
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </>
  )
} 