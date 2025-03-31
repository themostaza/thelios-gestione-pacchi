import { Metadata } from 'next'

import AuthView from '@/components/auth/AuthView'

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Login or create a new account',
}

export default function AuthPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <AuthView />
    </div>
  )
} 