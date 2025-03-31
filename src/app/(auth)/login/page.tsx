import { Metadata } from 'next'

import AuthView from '@/components/auth/AuthView'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your account',
}

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <AuthView defaultTab="login" />
    </div>
  )
} 