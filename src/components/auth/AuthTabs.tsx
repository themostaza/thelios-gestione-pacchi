'use client'

import { useState } from 'react'

import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuthTabsProps {
  defaultTab: 'login' | 'register'
}

export default function AuthTabs({ defaultTab }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  return (
    <Tabs
      defaultValue={defaultTab}
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <LoginForm onRegisterClick={() => setActiveTab('register')} />
      </TabsContent>
      
      <TabsContent value="register">
        <RegisterForm onLoginClick={() => setActiveTab('login')} />
      </TabsContent>
    </Tabs>
  )
} 