'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { getAllProfiles, createUser, deleteProfileUser } from '@/app/actions/userActions'

// Tipo per i profili utente
type ProfileUser = {
  id: string
  email: string
  created_at: string
  user_id: string | null
  is_admin: boolean
}

// Tipo per i dati del form di creazione
type CreateUserData = {
  email: string
  isAdmin: boolean
}

// Tipo per il context
type UserContextType = {
  users: ProfileUser[]
  loading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
  addUser: (userData: CreateUserData) => Promise<{ success: boolean; message: string }>
  deleteUser: (id: string, userId: string | null) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ProfileUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica tutti gli utenti
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

  // Aggiungi un nuovo utente
  const addUser = async (userData: CreateUserData) => {
    try {
      const result = await createUser(userData)
      if (result.success) {
        // Aggiorna la lista utenti dopo la creazione
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

  // Elimina un utente
  const deleteUser = async (id: string, userId: string | null) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await deleteProfileUser(id, userId)
        if (result.success) {
          // Aggiorna la lista dopo l'eliminazione
          refreshUsers()
        } else {
          alert(result.message)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error during deletion: ' + err
        alert('Error during deletion: ' + errorMessage)
      }
    }
  }

  // Carica gli utenti all'avvio
  useEffect(() => {
    refreshUsers()
  }, [])

  return <UserContext.Provider value={{ users, loading, error, refreshUsers, addUser, deleteUser }}>{children}</UserContext.Provider>
}

// Hook per usare il context
export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
