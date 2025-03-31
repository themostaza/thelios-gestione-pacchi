'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { logoutUser } from '@/app/actions/authActions'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

type User = {
  id: string
  email: string
  isAdmin: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  updateAuthState: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const updateAuthState = async () => {
    try {
      const supabase = createClient()
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      
      if (!supabaseUser) {
        setUser(null)
        setIsLoading(false)
        return
      }
      
      // Get user profile data to check if admin
      const { data: profileData } = await supabase
        .from('profile')
        .select('is_admin')
        .eq('user_id', supabaseUser.id)
        .single()
        
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        isAdmin: profileData?.is_admin || false
      })
    } catch (error) {
      console.error('Error fetching auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const logout = async () => {
    try {
      const result = await logoutUser()
      if (result.success) {
        setUser(null)
        router.refresh()
        router.push('/auth')
      } else {
        toast({
          title: 'Logout failed',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error during logout:', error)
      toast({
        title: 'Logout error',
        description: 'An unexpected error occurred during logout',
        variant: 'destructive',
      })
    }
  }
  
  useEffect(() => {
    updateAuthState()
    
    // Set up auth state change listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      updateAuthState()
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAdmin: user?.isAdmin || false,
      updateAuthState,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
