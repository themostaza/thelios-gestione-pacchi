'use server'

import { cookies } from 'next/headers'

import { currentUserIsAdmin as isAdmin } from '@/lib/functions'
import { createClient } from '@/lib/supabase/server'
import { LoginData, LoginResult, LogoutResult, RegisterResult, CreateUserResult, GetProfilesResult } from '@/lib/types/user'

export async function currentUserIsAdmin(): Promise<boolean> {
  return await isAdmin()
}

export async function loginUser(data: LoginData): Promise<LoginResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email!,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during login',
    }
  }
}

export async function registerUser(email: string, password: string): Promise<RegisterResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: profileData, error: profileError } = await supabase.from('profile').select('*').eq('email', email).is('user_id', null)

    if (profileError) {
      return {
        success: false,
        message: `Error checking profile: ${profileError.message}`,
      }
    }

    if (!profileData || profileData.length === 0) {
      return {
        success: false,
        message: 'Email not pre-authorized. Please contact administrator.',
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth`,
      },
    })

    if (authError) {
      return {
        success: false,
        message: authError.message || 'An error occurred during registration.',
      }
    }

    if (authData?.user?.id) {
      const { error: updateError } = await supabase.from('profile').update({ user_id: authData.user.id }).eq('email', email)

      if (updateError) {
        console.error('[SERVER] Error updating profile with user_id:', updateError)
      } else {
      }
    }

    return {
      success: true,
      message: "Registration complete. We've sent you a confirmation email.",
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SERVER] Unexpected error during registration:', errorMessage)
    return {
      success: false,
      message: `Error during registration: ${errorMessage}`,
    }
  }
}

export async function logoutUser(): Promise<LogoutResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        message: `Error during logout: ${error.message}`,
      }
    }

    return {
      success: true,
      message: 'Logout successful',
    }
  } catch (error) {
    console.error('Error during logout:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during logout',
    }
  }
}

export async function createUser({ email, isAdmin }: { email: string; isAdmin: boolean }): Promise<CreateUserResult> {
  try {
    const cookieStore = cookies()

    const supabase = createClient(cookieStore)

    const profileCheck = await supabase.from('profile').select('*').eq('email', email).single()

    const { data: existingProfile, error: existingError } = profileCheck

    if (existingError && existingError.code !== 'PGRST116') {
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

    const insertResult = await supabase
      .from('profile')
      .insert({
        email,
        is_admin: isAdmin,
        user_id: null,
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

export async function getAllProfiles(): Promise<GetProfilesResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

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

    const { data: profileData, error: profileError } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).single()

    if (profileError || !profileData?.is_admin) {
      return {
        users: null,
        success: false,
        message: 'You do not have the necessary permissions to access this feature',
      }
    }

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

    const { data: profileData, error: profileError } = await supabase.from('profile').select('is_admin').eq('user_id', user.id).single()

    if (profileError || !profileData?.is_admin) {
      return {
        success: false,
        message: 'You do not have the necessary permissions to perform this operation',
      }
    }

    const { error: deleteProfileError } = await supabase.from('profile').delete().eq('id', id)

    if (deleteProfileError) {
      console.error('[SERVER] Error deleting profile:', deleteProfileError)
      return {
        success: false,
        message: `Error deleting profile: ${deleteProfileError.message}`,
      }
    }

    if (userId) {
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
