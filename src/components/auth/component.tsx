'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import GenericCardView from '@/components/genericCardView'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/authContext'
import { useTranslation } from '@/i18n/I18nProvider'
import { RegisterFormData, LoginFormData } from '@/lib/types/user'
import { registerSchema } from '@/lib/validations/delivery'
import { loginSchema } from '@/lib/validations/user'

interface AuthViewProps {
  defaultTab?: 'login' | 'register'
}

export default function AuthView({ defaultTab = 'login' }: AuthViewProps) {
  const { t } = useTranslation()
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
      title={t('auth.login')}
      description={activeTab === 'login' ? t('auth.login') : t('auth.register')}
      footer={
        <div className='flex justify-end w-full'>
          <Button
            type='submit'
            form={activeTab === 'login' ? 'login-form' : 'register-form'}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <LogIn className='h-4 w-4 mr-2' />} {activeTab === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
          </Button>
        </div>
      }
      footerClassName='lg:w-1/3 m-auto'
    >
      <Tabs
        defaultValue={defaultTab}
        onValueChange={setActiveTab}
        className='w-full lg:w-1/3 m-auto'
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='login'>{t('auth.login')}</TabsTrigger>
          <TabsTrigger value='register'>{t('auth.register')}</TabsTrigger>
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
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.emailPlaceholder')}
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
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t('auth.passwordPlaceholder')}
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
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.emailPlaceholder')}
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
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t('auth.passwordPlaceholder')}
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
                    <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={t('auth.passwordPlaceholder')}
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
