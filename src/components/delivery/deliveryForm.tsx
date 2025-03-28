'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { saveDelivery } from '@/app/actions/deliveryActions'
import RecipientSelect from '@/components/delivery/recipientSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { deliverySchema, DeliveryFormData } from '@/lib/validations/delivery'

export default function DeliveryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [userEmail, setUserEmail] = useState('Loading...')

  useEffect(() => {
    // Get current user from Supabase
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email || 'Not authenticated')
    }

    getUser()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
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

  return (
    <Card className='w-full flex flex-col'>
      <Toaster />
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle className='text-2xl font-bold'>Delivery Registration</CardTitle>
            <CardDescription className='mt-2'>Enter package delivery details below</CardDescription>
          </div>
          <div className='text-muted-foreground text-sm text-right'>
            <div>
              <strong>Sender:</strong> {userEmail}
            </div>
            <div>
              <strong>Creation Date:</strong> {currentDateTime.toLocaleString()}
            </div>
          </div>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex-1 overflow-hidden flex flex-col'
        >
          <CardContent className='flex-1 overflow-hidden'>
            <div className='flex flex-col md:flex-row gap-4 h-full'>
              {/* Table area in a ScrollArea - now comes first */}
              <div className='w-full flex flex-col h-full overflow-hidden'>
                <ScrollArea className='h-full flex-1 overflow-auto'>
                  <div className='space-y-4 p-2'>
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
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>

          <CardFooter className='flex justify-end items-center'>
            <Button
              type='submit'
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
