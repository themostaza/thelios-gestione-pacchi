'use client'
import { Clipboard, PlusCircle, LayoutDashboard, Users, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

import { useAuth } from '@/context/authContext'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'

export default function NavigationButtons() {
  const pathname = usePathname()
  const router = useRouter()
  const [loadingButton, setLoadingButton] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const isLoggedIn = !!user
  const { t } = useTranslation()

  useEffect(() => {
    setLoadingButton(null)
    console.log('Current pathname:', pathname)
  }, [pathname])

  const navigationButtons = [
    {
      href: '/deliveries',
      text: t('deliveries.title'),
      icon: <Clipboard className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/deliveries',
    },
    {
      href: '/delivery/new',
      text: t('deliveries.newDelivery'),
      icon: <PlusCircle className='h-4 w-4 mr-2' />,
      isDisabled: false,
    },
  ]

  const adminButtons = [
    {
      href: '/dashboard',
      text: t('navigation.dashboard'),
      icon: <LayoutDashboard className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/dashboard',
    },
    {
      href: '/accounts',
      text: t('navigation.userManagement'),
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
    <div className='w-full'>
      <ul className='flex flex-col space-y-2 w-full'>
        {navigationButtons.map((button, index) => (
          <li
            key={`nav-${index}`}
            className='w-full'
          >
            <Link
              href={button.href}
              className={`flex items-center p-2 rounded-md w-full ${
                pathname === button.href ? 'bg-primary text-primary-foreground' : 'bg-background'
              } ${!isLoggedIn ? 'opacity-50 pointer-events-none' : 'hover:bg-accent'}`}
              onClick={(e) => handleNavigate(button.href, e)}
            >
              {loadingButton === button.href ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : button.icon}
              <span>{button.text}</span>
            </Link>
          </li>
        ))}

        {adminButtons.map((button, index) => (
          <li
            key={`admin-${index}`}
            className='w-full'
          >
            <Link
              href={button.href}
              className={`flex items-center p-2 rounded-md w-full ${
                pathname === button.href ? 'bg-primary text-primary-foreground' : 'bg-background'
              } ${!isLoggedIn || !isAdmin ? 'opacity-50 pointer-events-none' : 'hover:bg-accent'}`}
              onClick={(e) => handleNavigate(button.href, e)}
            >
              {loadingButton === button.href ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : button.icon}
              <span>{button.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
