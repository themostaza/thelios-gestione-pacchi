import { Metadata } from 'next'

import AuthView from '@/components/auth/AuthView'

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Login or create a new account',
}

export default function AuthPage() {
  return <AuthView />
}
