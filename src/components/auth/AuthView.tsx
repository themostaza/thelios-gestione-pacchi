'use client'

import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'

import AuthTabs from './AuthTabs'
import { useAuth } from '@/context/authContext'
import GenericCardView from '@/components/GenericCardView'
import { FooterButton } from '@/components/GenericCardView'

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
  
  // Primary and secondary footer buttons
  const footerButtons: FooterButton[] = [
    {
      label: activeTab === 'login' ? 'Sign in' : 'Register',
      icon: isSubmitting ? 
        <Loader2 className="h-4 w-4 animate-spin" /> : 
        activeTab === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />,
      onClick: triggerFormSubmit,
      disabled: isSubmitting
    }
  ]
  
  const secondaryFooterButtons: FooterButton[] = [
    {
      label: activeTab === 'login' 
        ? "Don't have an account? Register" 
        : "Already have an account? Sign in",
      onClick: () => setActiveTab(activeTab === 'login' ? 'register' : 'login')
    }
  ]

  return (
    <GenericCardView
      title="Authentication"
      description="Sign in or create a new account"
      footerButtons={footerButtons}
      secondaryFooterButtons={secondaryFooterButtons}
      footerClassName="md:w-1/3 m-auto"
    >
      <AuthTabs 
        defaultTab={defaultTab} 
        onTabChange={handleTabChange}
        hideButtons={true}
      />
    </GenericCardView>
  )
}
