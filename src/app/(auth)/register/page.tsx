import { Metadata } from 'next'

import AuthView from '@/components/auth/AuthView'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a new account',
}

export default function RegisterPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <AuthView defaultTab="register" />
    </div>
  )
} 