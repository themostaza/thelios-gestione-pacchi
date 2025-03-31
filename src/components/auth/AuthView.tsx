'use client'

import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

import AuthTabs from './AuthTabs'
import { useAuth } from '@/context/authContext'

interface AuthViewProps {
  defaultTab?: 'login' | 'register'
}

export default function AuthView({ defaultTab = 'login' }: AuthViewProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  // Function to handle active tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  }

  // Function to handle form submission triggered from footer
  const triggerFormSubmit = () => {
    // Find the active form and trigger its submit button
    const activeForm = document.querySelector(`form[data-tab="${activeTab}"]`);
    if (activeForm) {
      const submitBtn = activeForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        (submitBtn as HTMLButtonElement).click();
      }
    }
  }

  return (
    <Card className='w-full flex flex-col'>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle className='text-2xl font-bold'>Authentication</CardTitle>
            <CardDescription className='mt-2'>Sign in or create a new account</CardDescription>
          </div>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <div className='flex-1 overflow-hidden flex flex-col'>
        <CardContent className='flex-1 overflow-hidden'>
          <div className='flex flex-col md:flex-row gap-4 h-full'>
            {/* Table area in a ScrollArea - now comes first */}
            <div className='w-full flex flex-col h-full overflow-hidden'>
              <ScrollArea className='h-full flex-1 overflow-auto md:w-1/3 m-auto'>
                <AuthTabs 
                  defaultTab={defaultTab} 
                  onTabChange={handleTabChange}
                  hideButtons={true}
                />
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex flex-col space-y-4 pt-4 md:w-1/3 m-auto">
        <Button
          type="button"
          onClick={triggerFormSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : activeTab === 'login' ? (
            <LogIn size={20} className="mr-2" />
          ) : (
            <UserPlus size={20} className="mr-2" />
          )}
          {activeTab === 'login' ? 'Sign in' : 'Register'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
          className="w-full"
        >
          {activeTab === 'login' 
            ? "Don't have an account? Register" 
            : "Already have an account? Sign in"}
        </Button>
      </CardFooter>
    </Card>
  )
}
