'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { getAllProfiles, createUser, deleteProfileUser, resetUserPassword } from '@/app/actions/authActions'

type ProfileUser = {
  id: string
  email: string
  created_at: string
  user_id: string | null
  is_admin: boolean
  status: 'pending' | 'approved' | 'rejected' | 'registered' | 'reset_password'
}

type CreateUserData = {
  email: string
  isAdmin: boolean
  status?: 'pending' | 'approved' | 'rejected' | 'reset_password'
}

type UserContextType = {
  users: ProfileUser[]
  loading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
  addUser: (userData: CreateUserData) => Promise<{ success: boolean; message: string }>
  deleteUser: (id: string, userId: string | null) => Promise<{ success: boolean; message: string }>
  resetPassword: (id: string) => Promise<{ success: boolean; message: string }>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ProfileUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUsers = async () => {
    setLoading(true)
    try {
      const result = await getAllProfiles()
      if (result.success && result.users) {
        setUsers(result.users as unknown as ProfileUser[])
        setError(null)
      } else {
        setError(result.message || 'Error loading users')
        setUsers([])
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error: ' + err
      setError('Unexpected error: ' + errorMessage)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (userData: CreateUserData) => {
    try {
      const result = await createUser(userData)
      if (result.success) {
        refreshUsers()
      }
      return result
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating user: ' + error
      console.error('Error creating user:', errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  const deleteUser = async (id: string, userId: string | null) => {
    try {
      const result = await deleteProfileUser(id, userId)
      if (result.success) {
        refreshUsers()
        return { success: true, message: '' }
      } else {
        return { success: false, message: result.message }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error during deletion: ' + err
      return { success: false, message: errorMessage }
    }
  }

  const resetPassword = async (id: string) => {
    try {
      const result = await resetUserPassword(id)
      if (result.success) {
        refreshUsers()
      }
      return result
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error resetting password: ' + error
      console.error('Error resetting password:', errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  useEffect(() => {
    refreshUsers()
  }, [])

  return (
    <UserContext.Provider
      value={{
        users,
        loading,
        error,
        refreshUsers,
        addUser,
        deleteUser,
        resetPassword,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
