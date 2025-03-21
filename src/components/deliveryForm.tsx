'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { saveDelivery } from '@/app/actions/deliveryActions'
import RecipientSelect from '@/components/RecipientSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'
import { deliverySchema, DeliveryFormData } from '@/lib/validations/delivery'

export default function DeliveryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

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
              <span className='truncate'>Place: {result.data.place}</span>
              <span className='truncate'>Notes: {result.data.notes}</span>
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

  return (
    <Card className='w-96'>
      <Toaster />
      <CardHeader>
        <div className='flex flex-col items-center'>
          <CardTitle className='text-2xl font-bold text-center'>Delivery Registration</CardTitle>
          <p className='mt-2 text-sm text-muted-foreground text-center'>Enter package delivery details</p>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='recipient'
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor='recipient-search'>Recipient</FormLabel>
                  <FormControl>
                    <RecipientSelect
                      value={field.value}
                      onChange={field.onChange}
                      id='recipient'
                      name='recipient'
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
                  <FormLabel htmlFor='place'>Place</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id='place'
                      placeholder='Enter delivery place'
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
                  <FormLabel htmlFor='notes'>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      id='notes'
                      placeholder='Add package information, special instructions, etc.'
                      rows={4}
                      disabled={isSubmitting}
                      autoComplete='off'
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
                  Registering...
                </>
              ) : (
                <>
                  <Send
                    size={20}
                    className='mr-2'
                  />
                  Register Delivery
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
