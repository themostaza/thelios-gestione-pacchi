'use server'

import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

type CreateUserResult = {
  success: boolean
  message: string
  email?: string
  isAdmin?: boolean
}

export async function createUser({ email, isAdmin }: { email: string; isAdmin: boolean }): Promise<CreateUserResult> {
  try {
    // Create cookie store explicitly within the server action
    const cookieStore = cookies()

    const supabase = createClient(cookieStore)

    // Verifica se in profile esiste già questa email

    const profileCheck = await supabase.from('profile').select('*').eq('email', email).single()

    const { data: existingProfile, error: existingError } = profileCheck

    if (existingError && existingError.code !== 'PGRST116') {
      // Se l'errore non è "record not found" (codice supabase), ritornare errore
      console.error('[SERVER] Error checking profile existence:', existingError)
      return {
        success: false,
        message: `Error checking email existence: ${existingError.message}`,
      }
    }

    if (existingProfile) {
      return {
        success: false,
        message: 'A profile with this email already exists.',
      }
    }

    // Ora inseriamo un nuovo record in profile con user_id = null

    const insertResult = await supabase
      .from('profile')
      .insert({
        email,
        is_admin: isAdmin,
        user_id: null, // verrà aggiornato al momento del vero login
      })
      .select()
      .single()

    const { data, error } = insertResult

    if (error) {
      console.error('[SERVER] Error inserting profile:', error)
      return {
        success: false,
        message: `Error during profile insert: ${error.message}`,
      }
    }

    return {
      success: true,
      message: 'User pre-registered successfully',
      email: data.email,
      isAdmin: data.is_admin,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error in createUser:', errorMessage)
    return {
      success: false,
      message: `Errore inatteso durante createUser: ${errorMessage}`,
    }
  }
}

type ProfileUser = {
  id: string
  email: string
  created_at: string
  user_id: string | null
  // altri campi che potrebbero essere utili
}

type GetProfilesResult = {
  users: ProfileUser[] | null
  success: boolean
  message?: string
}

export async function getAllProfiles(): Promise<GetProfilesResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Controlla l'autenticazione dell'utente (opzionale, se vuoi limitare l'accesso)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        users: null,
        success: false,
        message: 'You must be authenticated to access this feature',
      }
    }

    // Verifica se l'utente è admin (opzionale, se vuoi limitare l'accesso)
    const { data: profileData, error: profileError } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).single()

    if (profileError || !profileData?.is_admin) {
      return {
        users: null,
        success: false,
        message: 'You do not have the necessary permissions to access this feature',
      }
    }

    // Recupera tutti i profili
    const { data: allProfiles, error: fetchError } = await supabase.from('profile').select('id, email, created_at, user_id, is_admin').order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[SERVER] Error fetching profiles:', fetchError)
      return {
        users: null,
        success: false,
        message: `Errore nel recupero degli utenti: ${fetchError.message}`,
      }
    }

    return {
      users: allProfiles,
      success: true,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error fetching profiles:', errorMessage)
    return {
      users: null,
      success: false,
      message: `Errore imprevisto: ${errorMessage}`,
    }
  }
}

export async function deleteProfileUser(id: string, userId: string | null): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Controlla l'autenticazione dell'utente
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        message: 'You must be authenticated to perform this operation',
      }
    }

    // Verifica se l'utente è admin
    const { data: profileData, error: profileError } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).single()

    if (profileError || !profileData?.is_admin) {
      return {
        success: false,
        message: 'You do not have the necessary permissions to perform this operation',
      }
    }

    // PASSO 1: Prima eliminiamo il profilo per rimuovere il riferimento al user_id

    const { error: deleteProfileError } = await supabase.from('profile').delete().eq('id', id)

    if (deleteProfileError) {
      console.error('[SERVER] Error deleting profile:', deleteProfileError)
      return {
        success: false,
        message: `Error deleting profile: ${deleteProfileError.message}`,
      }
    }

    // PASSO 2: Se c'è un user_id associato, ora possiamo eliminare l'utente in auth
    if (userId) {
      // Chiama una funzione PostgreSQL per eliminare l'utente
      const { error: rpcError } = await supabase.rpc('delete_user', { user_id: userId })

      if (rpcError) {
        console.error('[SERVER] Error deleting auth user:', rpcError)
        return {
          success: false,
          message: `Errore nell'eliminazione dell'account utente: ${rpcError.message}`,
        }
      }
    }

    return {
      success: true,
      message: 'User and profile successfully deleted',
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error deleting user:', errorMessage)
    return {
      success: false,
      message: `Errore imprevisto: ${errorMessage}`,
    }
  }
}
