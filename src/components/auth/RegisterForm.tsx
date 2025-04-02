'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/authContext'
import { useTranslation } from '@/i18n/I18nProvider'
import { RegisterFormData } from '@/lib/types/user'
import { registerSchema } from '@/lib/validations/user'

interface RegisterFormProps {
  onLoginClick?: () => void
  hideButtons?: boolean
  tabName?: string
}

export default function RegisterForm({ onLoginClick, hideButtons = false, tabName = 'register' }: RegisterFormProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()

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
    const success = await register(data.email, data.password)

    if (success && onLoginClick) {
      form.reset()
      setTimeout(() => {
        onLoginClick()
      }, 1000)
    }

    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id='register-form'
        className='space-y-4'
        data-tab={tabName}
      >
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
              <FormLabel htmlFor='password'>{t('auth.password')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id='password'
                  type='password'
                  placeholder={t('auth.passwordPlaceholder')}
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
              <FormLabel htmlFor='confirmPassword'>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id='confirmPassword'
                  type='password'
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete='new-password'
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
                <UserPlus
                  size={20}
                  className='mr-2'
                />
              )}
              {t('auth.registerButton')}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
