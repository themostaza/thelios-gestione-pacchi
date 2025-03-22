'use client'

import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User as UserIcon, LogOut, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="fixed top-4 right-4">
      {loading ? (
        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-secondary-foreground" />
        </div>
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center cursor-pointer hover:opacity-90">
              <UserIcon className="h-5 w-5 text-secondary-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className='text-sm text-muted-foreground'>{user.email}</DropdownMenuLabel>
            <DropdownMenuLabel className='text-sm text-muted-foreground'>
              Role: {user.user_metadata?.role || 'User'}
            </DropdownMenuLabel>
            <DropdownMenuLabel className='text-sm text-muted-foreground'>
              Status: {user.user_metadata?.is_activated ? 'Activated' : 'Not Activated'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link 
          href="/" 
          className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 cursor-pointer"
          aria-label="Log in"
        >
          <LogIn className="h-5 w-5 text-secondary-foreground" />
        </Link>
      )}
    </div>
  )
}
