'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { registerUser } from '@/app/actions/authActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/hooks/use-toast'

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Inserisci un indirizzo email valido' }),
    password: z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri' }),
    confirmPassword: z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non combaciano',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterForm() {
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
    console.log('Form submitted, calling server action')
    setIsSubmitting(true)

    try {
      // Chiamiamo la server action invece di usare Supabase direttamente
      const result = await registerUser(data.email, data.password)

      console.log('Registration result:', result)

      if (result.success) {
        toast({
          title: 'Registrazione completata',
          description: result.message,
        })
        form.reset()

        // Redirect dopo breve pausa
        setTimeout(() => {
          router.refresh()
          router.push('/auth')
        }, 2000)
      } else {
        toast({
          title: 'Errore registrazione',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error during registration:', error)
      toast({
        title: 'Errore inatteso',
        description: 'Si è verificato un errore inaspettato durante la registrazione.',
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
            <CardTitle className='text-2xl font-bold'>Registrazione nuovo utente</CardTitle>
            <CardDescription className='mt-2'>Crea un nuovo account per accedere all&apos;applicazione</CardDescription>
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
                  <FormLabel htmlFor='email'>Indirizzo email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id='email'
                      type='email'
                      placeholder='tuoemail@esempio.com'
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
                  <FormLabel htmlFor='confirmPassword'>Conferma password</FormLabel>
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
              Registrati
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
