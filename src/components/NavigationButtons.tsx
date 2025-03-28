'use client'
import { Clipboard, PlusCircle, LayoutDashboard, Users, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/authContext'

export default function NavigationButtons() {
  const pathname = usePathname()
  const router = useRouter()
  const [loadingButton, setLoadingButton] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const isLoggedIn = !!user

  // Reset loading state when pathname changes (navigation completes)
  useEffect(() => {
    setLoadingButton(null)
  }, [pathname])

  // Regular navigation buttons - visible to all users
  const navigationButtons = [
    {
      href: '/deliveries',
      text: 'All Deliveries',
      icon: <Clipboard className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/deliveries',
    },
    {
      href: '/delivery/new',
      text: 'New Delivery',
      icon: <PlusCircle className='h-4 w-4 mr-2' />,
      isDisabled: false,
    },
  ]

  // Admin-only navigation buttons
  const adminButtons = [
    {
      href: '/dashboard',
      text: 'Dashboard',
      icon: <LayoutDashboard className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/dashboard',
    },
    {
      href: '/accounts',
      text: 'User Management',
      icon: <Users className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/accounts',
    },
  ]

  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (href !== pathname) {
      setLoadingButton(href)
      router.push(href)
    }
  }

  return (
    <div className='flex flex-row w-full justify-between items-center'>
      {/* Admin buttons displayed first (on the left) */}
      <div className='flex space-x-2'>
        {isLoggedIn &&
          isAdmin &&
          adminButtons.map((button, index) => (
            <Button
              key={index}
              className='justify-start'
              size='sm'
              disabled={button.isDisabled}
              onClick={(e) => handleNavigate(button.href, e)}
            >
              {loadingButton === button.href ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : button.icon}
              {button.text}
            </Button>
          ))}
      </div>

      {/* Regular navigation buttons on the right */}
      <div className='flex space-x-2'>
        {isLoggedIn &&
          navigationButtons.map((button, index) => (
            <Button
              key={index}
              variant='ghost'
              className='justify-start'
              size='sm'
              disabled={button.isDisabled}
              onClick={(e) => handleNavigate(button.href, e)}
            >
              {loadingButton === button.href ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : button.icon}
              {button.text}
            </Button>
          ))}
      </div>
    </div>
  )
}
