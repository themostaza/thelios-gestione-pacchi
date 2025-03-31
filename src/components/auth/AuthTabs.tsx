'use client'

import { useState, useEffect } from 'react'

import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuthTabsProps {
  defaultTab: 'login' | 'register'
  onTabChange?: (value: string) => void
  hideButtons?: boolean
}

export default function AuthTabs({ defaultTab, onTabChange, hideButtons = false }: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  const handleValueChange = (value: string) => {
    setActiveTab(value)
    if (onTabChange) {
      onTabChange(value)
    }
  }

  useEffect(() => {
    if (onTabChange) {
      onTabChange(defaultTab)
    }
  }, [defaultTab, onTabChange])

  return (
    <Tabs
      defaultValue={defaultTab}
      value={activeTab}
      onValueChange={handleValueChange}
      className='w-full md:w-1/3 m-auto'
    >
      <TabsList className='grid grid-cols-2 mb-4'>
        <TabsTrigger value='login'>Login</TabsTrigger>
        <TabsTrigger value='register'>Register</TabsTrigger>
      </TabsList>

      <TabsContent value='login'>
        <LoginForm
          hideButtons={hideButtons}
          tabName='login'
        />
      </TabsContent>

      <TabsContent value='register'>
        <RegisterForm
          onLoginClick={() => handleValueChange('login')}
          hideButtons={hideButtons}
          tabName='register'
        />
      </TabsContent>
    </Tabs>
  )
}
