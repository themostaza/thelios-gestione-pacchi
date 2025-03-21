'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="fixed top-0 right-0 m-4 p-2 bg-gray-100 dark:bg-gray-800 rounded shadow">
        Checking authentication...
      </div>
    )
  }

  return (
    <div className="fixed top-0 right-0 m-4 p-2 bg-gray-100 dark:bg-gray-800 rounded shadow">
      {user ? (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Logged in as: {user.email}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          <span>Not logged in</span>
        </div>
      )}
    </div>
  )
} 