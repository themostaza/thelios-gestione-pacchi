'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { saveDelivery } from '@/app/actions/deliveryActions'
import RecipientSelect from '@/components/delivery/recipientSelect'
import GenericCardView from '@/components/GenericCardView'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { DeliveryFormData } from '@/lib/types/delivery'
import { deliverySchema } from '@/lib/validations/delivery'
import { useTranslation } from '@/i18n/I18nProvider'

export default function DeliveryForm() {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState(t('common.loading'))

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email || 'Not authenticated')
    }

    getUser()
  }, [])

  const form = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      recipient: '',
      place: '',
      notes: '',
    },
  })

  const onSubmit = async (data: DeliveryFormData) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('recipient', data.recipient)
      formData.append('place', data.place)
      formData.append('notes', data.notes)

      const result = await saveDelivery(formData)

      if (result.success) {
        form.reset()
        toast({
          title: 'Delivery registered successfully',
          description: (
            <div className='flex flex-col gap-2'>
              <span className='truncate'>
                Delivery ID: {result.data.id}, Created at: {new Date(result.data.created_at).toLocaleString()}
              </span>
              <span className='truncate'>Recipient: {result.data.recipientEmail}</span>
              <Button
                size='sm'
                asChild
                className='mt-2'
              >
                <Link href={`/delivery/${result.data.id}`}>View Delivery</Link>
              </Button>
            </div>
          ),
        })
      } else {
        if (result.errors) {
          Object.keys(form.getValues()).forEach((key) => {
            const fieldKey = key as keyof DeliveryFormData
            const errorValue = result.errors[fieldKey]
            form.setError(fieldKey, {
              type: 'server',
              message: Array.isArray(errorValue) ? errorValue.join(', ') : errorValue,
            })
          })
        }

        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const headerRight = (
    <div className='text-muted-foreground text-sm text-right'>
      <div>
        <strong>From:</strong> {userEmail}
      </div>
    </div>
  )

  const footerContent = (
    <div className='flex justify-end items-center w-full'>
      <Button
        type='submit'
        form='delivery-form'
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin mr-2' />
            Registering...
          </>
        ) : (
          <>
            <Send
              size={20}
              className='mr-2'
            />
            {t('deliveries.register')}
          </>
        )}
      </Button>
    </div>
  )

  return (
    <>
      <GenericCardView
        title={t('deliveries.newDelivery')}
        description={t('deliveries.newDelivery')}
        headerRight={headerRight}
        footer={footerContent}
      >
        <Form {...form}>
          <form
            id='delivery-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='w-full h-full'
          >
            <div className='space-y-4 p-2'>
              <FormField
                control={form.control}
                name='recipient'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='recipient'>{t('deliveries.recipient')}</FormLabel>
                    <FormControl>
                      <RecipientSelect
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='place'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='place'>{t('deliveries.place')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id='place'
                        placeholder={t('deliveries.enterPlace')}
                        disabled={isSubmitting}
                        autoComplete='off'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='notes'>{t('common.notes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id='notes'
                        placeholder={t('common.optionalNotes')}
                        rows={4}
                        disabled={isSubmitting}
                        autoComplete='off'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </GenericCardView>
    </>
  )
}
