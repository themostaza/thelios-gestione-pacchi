'use client'

import { LogOut, LogIn, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { logoutUser } from '@/app/actions/authActions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/authContext'

import { Button } from './ui/button'

export default function AuthStatus() {
  const { user, isAdmin, updateAuthState } = useAuth()
  const router = useRouter()

  // Handle logout
  const handleLogout = async () => {
    console.log('Starting logout process')
    try {
      // The logoutUser function will handle the redirect server-side
      await logoutUser()
      // If the redirect doesn't happen, update auth state
      await updateAuthState()
      console.log('Redirect failed, manually refreshing')
      router.refresh()
    } catch (err: unknown) {
      // NEXT_REDIRECT is an expected "error" - it means the redirect is working
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        console.log('Redirect in progress...')
        return
      }

      // Only log actual errors
      console.error('Unexpected error during logout:', err)
      // Update auth state on error
      await updateAuthState()
    }
  }

  return (
    <div className=''>
      {!user ? (
        <Link
          href='/auth'
          className='h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 cursor-pointer'
          aria-label='Log in'
        >
          <LogIn className='h-4 w-4 text-primary-foreground' />
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90'>
              <UserIcon className='h-4 w-4 text-primary-foreground' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel className='text-sm text-muted-foreground'>{user.email}</DropdownMenuLabel>
            <DropdownMenuLabel className='text-xs italic text-muted-foreground'>Role: {isAdmin ? 'Admin' : 'User'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className='cursor-pointer'
            >
              <Button
                onClick={handleLogout}
                variant='ghost'
                className='flex items-center justify-center'
              >
                <LogOut />
                <span>Log out</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
