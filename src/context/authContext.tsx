'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

import { getUserSession } from '@/app/actions/authActions'
import { createClient } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  updateAuthState: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const updateAuthState = async () => {
    setIsLoading(true)
    try {
      const { user: serverUser, isAdmin: serverIsAdmin } = await getUserSession()
      setUser(serverUser)
      setIsAdmin(serverIsAdmin)
      router.refresh()
    } catch (error) {
      console.error('Error updating auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial auth state fetch
    updateAuthState()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { isAdmin: serverIsAdmin } = await getUserSession()
        setIsAdmin(serverIsAdmin)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      router.refresh()
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        updateAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
