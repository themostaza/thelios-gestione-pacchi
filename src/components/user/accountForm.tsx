'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useUser } from '@/context/userContext'
import { toast } from '@/hooks/use-toast'
import { CreateUserFormData } from '@/lib/types/user'
import { createUserSchema } from '@/lib/validations/user'
import { useTranslation } from '@/i18n/I18nProvider'

export default function CreateUserFormWithContext() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addUser } = useUser()

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      isAdmin: false,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)

    try {
      const result = await addUser(data)

      if (result.success) {
        toast({
          title: t('user.createUser'),
          description: `Email: ${data.email} - ${t('user.isAdmin')}: ${data.isAdmin ? t('user.status.admin') : t('user.status.notAdmin')}`,
        })
        form.reset()
      } else {
        toast({
          title: t('common.error'),
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error in onSubmit:', error)
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : t('common.error')

      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6'
      >
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder={t('auth.emailPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator className='my-4' />

          <FormField
            control={form.control}
            name='isAdmin'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between space-x-2 space-y-0'>
                <FormLabel>{t('user.isAdmin')}</FormLabel>
                <FormControl>
                  <Switch
                    disabled={isSubmitting}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('user.createUser')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
