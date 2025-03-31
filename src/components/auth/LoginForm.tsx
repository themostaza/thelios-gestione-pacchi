'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/authContext'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  hideButtons?: boolean
  tabName?: string
}

export default function LoginForm({ hideButtons = false, tabName = 'login' }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    await login(data.email, data.password)
    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id='login-form'
        className='space-y-4'
        data-tab={tabName}
      >
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

        {/* Bottoni visibili solo se richiesto */}
        {!hideButtons && (
          <div className='flex flex-col space-y-4 pt-4'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full'
            >
              {isSubmitting ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <LogIn
                  size={20}
                  className='mr-2'
                />
              )}
              Sign in
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
