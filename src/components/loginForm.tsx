'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { Loader2, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type LoginFormData = z.infer<typeof loginSchema>

async function checkAndCreateProfile(supabase: SupabaseClient, userId: string, email: string) {
  try {
    // Check if profile exists
    const { data: profile, error: fetchError } = await supabase.from('profile').select('*').eq('user_id', userId).single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking profile:', fetchError)
      return
    }

    // If profile doesn't exist, create one
    if (!profile) {
      console.log('Creating new profile for user:', userId)
      const profileData = {
        user_id: userId,
        email,
        is_admin: false, // Adding is_admin field which may be required
      }

      console.log('Profile data to insert:', profileData)

      const { data: insertData, error: insertError } = await supabase.from('profile').insert(profileData).select()

      if (insertError) {
        console.error('Error creating profile:', insertError)
        console.error('Error code:', insertError.code)
        console.error('Error details:', insertError.details)
        console.error('Error message:', insertError.message)
      } else {
        console.log('Profile created successfully:', insertData)
      }
    }
  } catch (error) {
    console.error('Profile check/create error:', error)
  }
}

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingMagicLink, setIsProcessingMagicLink] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const supabaseRef = useRef(supabase)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Handle magic link authentication on component mount
  useEffect(() => {
    const processMagicLink = async () => {
      console.log('Checking for magic link: URL =', window.location.href)

      // Check specifically for the '#access_token=' hash which indicates a successful magic link auth
      // Or the code parameter in the URL which indicates OAuth/magic link flow
      const hasAccessToken = window.location.hash.includes('access_token=')
      const hasCodeParam = new URLSearchParams(window.location.search).get('code')

      if (hasAccessToken || hasCodeParam) {
        console.log('Auth parameters detected:', {
          hasAccessToken,
          hasCodeParam,
          hash: window.location.hash,
          search: window.location.search,
        })

        setIsProcessingMagicLink(true)

        try {
          if (hasAccessToken) {
            // Directly use the URL fragment - this is the key change
            await supabaseRef.current.auth.signInWithPassword({
              email: '', // These won't be used because we're providing the hash
              password: '',
            })

            // Now try to get the session after the sign-in attempt
            const sessionResult = await supabaseRef.current.auth.getSession()
            console.log('Session after explicit handling:', sessionResult)

            if (sessionResult.data.session) {
              console.log('User authenticated:', sessionResult.data.session.user)
              const user = sessionResult.data.session.user

              // Check/create profile for the user
              await checkAndCreateProfile(supabaseRef.current, user.id, user.email || '')

              toast({
                title: 'Magic link login successful',
                description: 'You have been logged in successfully',
              })

              // Clear URL parameters for security
              if (window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname)
              }

              // Navigate to dashboard
              setTimeout(() => {
                router.refresh()
                router.push('/deliveries')
              }, 1000)

              return
            }
          }

          // Set up a listener for auth state changes as a fallback
          console.log('Setting up auth state listener')
          const {
            data: { subscription },
          } = supabaseRef.current.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session)

            if (event === 'SIGNED_IN' && session) {
              // Check/create profile for the user
              checkAndCreateProfile(supabaseRef.current, session.user.id, session.user.email || '')

              toast({
                title: 'Magic link login successful',
                description: 'You have been logged in successfully',
              })

              // Clear URL parameters
              if (window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname)
              }

              // Navigate to dashboard
              router.refresh()
              router.push('/deliveries')

              // Clean up subscription
              subscription.unsubscribe()
            }
          })

          // Try to use the hash directly with Supabase's method
          if (hasAccessToken) {
            // This is another approach that might work
            const hashObj = Object.fromEntries(
              window.location.hash
                .substring(1)
                .split('&')
                .map((item) => item.split('='))
            )

            if (hashObj.access_token) {
              console.log('Attempting to set session with access token')
              const { error } = await supabaseRef.current.auth.setSession({
                access_token: decodeURIComponent(hashObj.access_token),
                refresh_token: decodeURIComponent(hashObj.refresh_token || ''),
              })

              if (error) {
                console.error('Error setting session:', error)
              } else {
                console.log('Session set successfully')
              }
            }
          }

          // Keep the processing state for a bit longer to allow the auth to complete
          setTimeout(() => {
            setIsProcessingMagicLink(false)
          }, 5000)
        } catch (err) {
          console.error('Unexpected error during magic link auth:', err)
          toast({
            title: 'Authentication error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
          })
          setIsProcessingMagicLink(false)
        }
      }
    }

    processMagicLink()
  }, [router])

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)

    try {
      const { error } = await supabaseRef.current.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast({
            title: 'Authentication failed',
            description: 'The email or password you entered is incorrect. Please try again.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Login error',
            description: error.message || 'An unexpected error occurred',
            variant: 'destructive',
          })
        }
        return
      }

      // Get the current user after successful login
      const {
        data: { user },
      } = await supabaseRef.current.auth.getUser()

      if (user) {
        // Check/create profile for the user
        await checkAndCreateProfile(supabaseRef.current, user.id, user.email || '')
      }

      toast({
        title: 'Login successful',
        description: 'Redirecting to dashboard...',
      })

      router.refresh()

      router.push('/deliveries')
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
    <Card className='w-96'>
      <Toaster />
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle className='text-2xl font-bold'>Sign in to your account</CardTitle>
            <CardDescription className='mt-2'>Enter your credentials to access the application</CardDescription>
          </div>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      {isProcessingMagicLink ? (
        <CardContent className='flex flex-col items-center justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin mb-4' />
          <p className='text-center text-muted-foreground'>Processing your magic link...</p>
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className='space-y-4 pt-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='email'>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id='email'
                        type='email'
                        placeholder='your@email.com'
                        autoComplete='email'
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='password'>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id='password'
                        type='password'
                        placeholder='••••••••'
                        autoComplete='current-password'
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='w-full'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn
                      size={20}
                      className='mr-2'
                    />
                    Sign in
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  )
}
