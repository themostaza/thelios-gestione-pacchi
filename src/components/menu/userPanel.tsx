'use client'

import { LogOut, LogIn, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/authContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function AuthStatus() {
  const { user, isAdmin, logout } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const handleLogout = async () => {
    try {
      await logout()
      router.refresh()
      return true
    } catch (err: unknown) {
      console.error('Unexpected error during logout:', err)
    }
  }

  return (
    <div className=''>
      {!user ? (
        <div className='flex flex-col items-center gap-3 p-2 rounded-md border bg-card shadow-sm'>
          <div className='h-8 w-8 rounded-full bg-primary flex items-center justify-center'>
            <UserIcon className='h-4 w-4 text-primary-foreground' />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>{t('auth.notAuthenticated')}</span>
            <span className='text-xs text-muted-foreground'>{t('auth.loginToContinue')}</span>
          </div>
          <Link
            href='/auth'
            className='inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground gap-1'
            aria-label={t('auth.login')}
          >
            <LogIn className='h-3 w-3' />
            <span>{t('auth.login')}</span>
          </Link>
        </div>
      ) : (
        <div className='flex flex-col items-center gap-3 p-2 rounded-md border bg-card shadow-sm'>
          <div className='h-8 w-8 rounded-full bg-primary flex items-center justify-center'>
            <UserIcon className='h-4 w-4 text-primary-foreground' />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>{user.email}</span>
            <span className='text-xs text-muted-foreground'>
              {t('auth.role')}: {isAdmin ? t('auth.admin') : t('auth.user')}
            </span>
          </div>
          <Button
            onClick={handleLogout}
            variant='outline'
            size='sm'
            className='ml-2 flex items-center gap-1'
          >
            <LogOut className='h-3 w-3' />
            <span>{t('auth.logout')}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
