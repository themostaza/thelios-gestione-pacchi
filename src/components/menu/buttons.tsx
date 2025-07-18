'use client'
import { Clipboard, PlusCircle, LayoutDashboard, Users, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useAuth } from '@/context/authContext'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'

import { Separator } from '../ui/separator'

export default function NavigationButtons({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loadingButton, setLoadingButton] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const isLoggedIn = !!user
  const { t } = useTranslation()

  useEffect(() => {
    setLoadingButton(null)
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
    {
      href: '/dashboard',
      text: t('navigation.dashboard'),
      icon: <LayoutDashboard className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/dashboard',
    },
  ]

  const adminButtons = [
    {
      href: '/accounts',
      text: t('navigation.userManagement'),
      icon: <Users className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/accounts',
    },
    {
      href: '/cron-test',
      text: 'Test Cron',
      icon: <Clock className='h-4 w-4 mr-2' />,
      isDisabled: pathname === '/cron-test',
    },
  ]

  const handleNavigate = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (href !== pathname) {
      setLoadingButton(href)
      router.push(href)
    }
    if (onNavigate) onNavigate()
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
              className={cn(
                'flex items-center p-2 rounded-md w-full',
                pathname === button.href ? 'bg-primary text-primary-foreground hover:bg-primary/60 cursor-default' : 'bg-background hover:bg-accent',
                !isLoggedIn && 'opacity-50 pointer-events-none'
              )}
              onClick={(e) => handleNavigate(button.href, e)}
            >
              {loadingButton === button.href ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : button.icon}
              <span>{button.text}</span>
            </Link>
          </li>
        ))}

        {adminButtons.length > 0 && isAdmin && (
          <>
            <Separator />
            {adminButtons.map((button, index) => (
              <li
                key={`admin-${index}`}
                className='w-full'
              >
                <Link
                  href={button.href}
                  className={cn(
                    'flex items-center p-2 rounded-md w-full',
                    pathname === button.href ? 'bg-primary text-primary-foreground hover:bg-primary/60 cursor-default' : 'bg-background hover:bg-accent',
                    !isLoggedIn && 'opacity-50 pointer-events-none'
                  )}
                  onClick={(e) => handleNavigate(button.href, e)}
                >
                  {loadingButton === button.href ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : button.icon}
                  <span>{button.text}</span>
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  )
}
