'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@/i18n/I18nProvider'

import { registerUser } from '@/app/actions/authActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'
import { RegisterFormData } from '@/lib/types/user'
import { registerSchema } from '@/lib/validations/user'

export default function RegisterForm() {
  const { t } = useTranslation()
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
          title: 'Registration completed',
          description: result.message,
        })
        form.reset()

        setTimeout(() => {
          router.refresh()
          router.push('/auth')
        }, 2000)
      } else {
        toast({
          title: 'Registration error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error', error)
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
    <Card className='w-full'>
      <Toaster />
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle className='text-2xl font-bold'>{t('auth.newUserRegistration')}</CardTitle>
            <CardDescription className='mt-2'>{t('auth.createNewAccountDescription')}</CardDescription>
          </div>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col justify-center items-center'
        >
          <CardContent className='space-y-4 pt-4 w-96'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor='email'>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id='email'
                      type='email'
                      placeholder={t('auth.emailPlaceholder')}
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
                      autoComplete='new-password'
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor='confirmPassword'>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id='confirmPassword'
                      type='password'
                      placeholder='••••••••'
                      autoComplete='new-password'
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
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <UserPlus
                  size={20}
                  className='mr-2'
                />
              )}
              Register
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
