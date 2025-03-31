'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import GenericCardView from '@/components/GenericCardView'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/authContext'

interface AuthViewProps {
  defaultTab?: 'login' | 'register'
}

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

export default function AuthView({ defaultTab = 'login' }: AuthViewProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useAuth()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    const success = await login(data.email, data.password)
    if (!success) {
      setIsSubmitting(false)
    }
  }

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    const success = await register(data.email, data.password)
    if (success) {
      registerForm.reset()
      setActiveTab('login')
    }
    setIsSubmitting(false)
  }

  return (
    <GenericCardView
      title='Authentication'
      description='Sign in or create a new account'
      footer={
        <div className='flex justify-end w-full'>
          <Button
            type='submit'
            form={activeTab === 'login' ? 'login-form' : 'register-form'}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
            ) : activeTab === 'login' ? (
              <LogIn
                size={20}
                className='mr-2'
              />
            ) : (
              <UserPlus
                size={20}
                className='mr-2'
              />
            )}
            {activeTab === 'login' ? 'Sign in' : 'Register'}
          </Button>
        </div>
      }
      footerClassName='md:w-1/3 m-auto'
    >
      <Tabs
        defaultValue={defaultTab}
        onValueChange={setActiveTab}
        className='w-full md:w-1/3 m-auto'
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='login'>Login</TabsTrigger>
          <TabsTrigger value='register'>Register</TabsTrigger>
        </TabsList>

        <TabsContent value='login'>
          <Form {...loginForm}>
            <form
              id='login-form'
              className='space-y-4'
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            >
              <FormField
                control={loginForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='your@email.com'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </TabsContent>

        <TabsContent value='register'>
          <Form {...registerForm}>
            <form
              id='register-form'
              className='space-y-4'
              onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
            >
              <FormField
                control={registerForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='your@email.com'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </GenericCardView>
  )
}
