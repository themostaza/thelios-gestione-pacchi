'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { createUser } from '@/app/actions/userActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'

// Schema di validazione semplificato (solo email e isAdmin)
const createUserSchema = z.object({
  email: z.string().email('Email non valida'),
  isAdmin: z.boolean(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function CreateUserForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      isAdmin: false,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    console.log('[CLIENT] Form submitted with:', data)
    setIsSubmitting(true)
    setFormError(null)

    try {
      console.log('[CLIENT] Calling createUser with:', data)
      const result = await createUser(data)
      console.log('[CLIENT] createUser result:', result)

      if (result.success) {
        toast({
          title: 'Utente pre-registrato con successo',
          description: `Email: ${result.email} - isAdmin: ${result.isAdmin ? 'Sì' : 'No'}`,
        })
        form.reset()
      } else {
        // Mostra il messaggio di errore sia nel form che in un toast
        setFormError(result.message)
        toast({
          title: "Impossibile pre-registrare l'utente",
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      // Qui gestiamo solo gli errori tecnici imprevisti
      console.error('[CLIENT] Unexpected error in onSubmit:', error)
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Si è verificato un errore inaspettato.'

      setFormError(errorMessage)
      toast({
        title: 'Errore inatteso',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          {formError && (
            <div className='px-6 pt-6'>
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>{formError}</div>
            </div>
          )}
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder='user@example.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name='isAdmin'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between space-x-2 space-y-0'>
                  <FormLabel>Admin?</FormLabel>
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
          </CardContent>
          <CardFooter>
            <Button
              type='submit'
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sto registrando...' : 'Pre-registra utente'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
