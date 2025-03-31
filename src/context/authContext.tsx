'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { loginUser, logoutUser, registerUser } from '@/app/actions/authActions'
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
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser()

      if (!supabaseUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const { data: profileData } = await supabase.from('profile').select('is_admin').eq('user_id', supabaseUser.id).single()

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        isAdmin: profileData?.is_admin || false,
      })
    } catch (error) {
      console.error('Error fetching auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await loginUser({ email, password })

      if (result.success) {
        await fetchUserData()
        router.refresh()
        return true
      } else {
        toast({
          title: 'Login failed',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        })
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Login error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
      return false
    }
  }

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await registerUser(email, password)

      if (result.success) {
        toast({
          title: 'Registration successful',
          description: 'Your account has been created',
        })
        return true
      } else {
        toast({
          title: 'Registration failed',
          description: result.message || 'Could not create account',
          variant: 'destructive',
        })
        return false
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: 'Registration error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
      return false
    }
  }

  const logout = async () => {
    try {
      await logoutUser()

      setUser(null)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
        console.error('Error during logout:', error)
        toast({
          title: 'Logout failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    }
  }

  useEffect(() => {
    fetchUserData()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.isAdmin || false,
        login,
        register,
        logout,
      }}
    >
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
