'use client'

import { User as UserIcon, LogOut, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

import { Button } from './ui/button'

// Client component
export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is admin
  const checkIfAdmin = async () => {
    if (!user) return false
    
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      return !!data && !error
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      if (currentUser) {
        const adminStatus = await checkIfAdmin()
        setIsAdmin(adminStatus)
      }
    }
    
    getUser()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      
      if (session?.user) {
        const adminStatus = await checkIfAdmin()
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }
      
      router.refresh()
    })
    
    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div className=''>
      {!user ? (
        <Link
          href='/'
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
