import { User as UserIcon, LogOut, LogIn } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { iAmAdmin } from '@/actions/admin'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/server'

import { Button } from './ui/button'

// Server action for logout
async function logout() {
  'use server'
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/')
}

// Server component for logout functionality
function LogoutButton() {
  return (
    <DropdownMenuItem
      asChild
      className='cursor-pointer'
    >
      <form action={logout}>
        <Button
          type='submit'
          variant='ghost'
          className='flex items-center justify-center'
        >
          <LogOut />
          <span>Log out</span>
        </Button>
      </form>
    </DropdownMenuItem>
  )
}

// Server component
export default async function AuthStatus() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use the iAmAdmin server action instead of checking directly
  const isAdmin = user ? await iAmAdmin() : false

  return (
    <div className='fixed top-4 right-4'>
      {!user ? (
        <Link
          href='/'
          className='h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 cursor-pointer'
          aria-label='Log in'
        >
          <LogIn className='h-5 w-5 text-primary-foreground' />
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='h-10 w-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90'>
              <UserIcon className='h-5 w-5 text-primary-foreground' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel className='text-sm text-muted-foreground'>{user.email}</DropdownMenuLabel>
            <DropdownMenuLabel className='text-xs italic text-muted-foreground'>Role: {isAdmin ? 'Admin' : 'User'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
