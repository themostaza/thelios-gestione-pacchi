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
        setError(result.message || 'Errore nel caricamento degli utenti')
        setUsers([])
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError('Errore inaspettato: ' + errorMessage)
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
      const errorMessage = error instanceof Error ? error.message : 'Errore inaspettato durante la creazione utente'
      console.error('Errore nella creazione utente:', errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  // Elimina un utente
  const deleteUser = async (id: string, userId: string | null) => {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        const result = await deleteProfileUser(id, userId)
        if (result.success) {
          // Aggiorna la lista dopo l'eliminazione
          refreshUsers()
        } else {
          alert(result.message)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
        alert("Errore durante l'eliminazione: " + errorMessage)
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
