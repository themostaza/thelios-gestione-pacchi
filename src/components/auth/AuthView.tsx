'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import AuthTabs from './AuthTabs'

interface AuthViewProps {
  defaultTab?: 'login' | 'register'
}

export default function AuthView({ defaultTab = 'login' }: AuthViewProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Authentication</CardTitle>
            <CardDescription className="mt-2">Sign in or create a new account</CardDescription>
          </div>
        </div>
        <Separator className="mt-4" />
      </CardHeader>
      
      <CardContent>
        <AuthTabs defaultTab={defaultTab} />
      </CardContent>
    </Card>
  )
} 