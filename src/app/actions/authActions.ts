'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { LoginData, LoginResult, LogoutResult, RegisterResult, CreateUserResult, GetProfilesResult, ProfileUser } from '@/lib/types/user'
import { currentUserIsAdmin as isAdmin } from '@/lib/functions'
import { z } from 'zod'

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
    const adminClient = createAdminClient()

    // First, check if there's already a registered user with this email
    const { data: existingUser, error: existingError } = await supabase
      .from('profile')
      .select('*')
      .eq('email', email)
      .eq('status', 'registered')
      .not('user_id', 'is', null)
      .maybeSingle()

    if (existingError) {
      return {
        success: false,
        message: `Error checking existing user: ${existingError.message}`,
      }
    }

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email is already registered.',
      }
    }

    // Check for profiles that can be registered (pending or reset_password)
    const { data: profileData, error: profileError } = await supabase
      .from('profile')
      .select('*')
      .eq('email', email)
      .in('status', ['pending', 'reset_password'])
      .maybeSingle()

    if (profileError) {
      return {
        success: false,
        message: `Error checking profile: ${profileError.message}`,
      }
    }

    if (!profileData) {
      return {
        success: false,
        message: 'Email not pre-authorized or already registered. Please contact administrator.',
      }
    }

    const isResetPassword = profileData.status === 'reset_password'

    if (isResetPassword) {
      // For reset password, we need to update the existing user's password
      if (!profileData.user_id) {
        return {
          success: false,
          message: 'Invalid reset password request. Please contact administrator.',
        }
      }

      // Update the existing user's password using admin API
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        profileData.user_id,
        { password }
      )

      if (updateError) {
        return {
          success: false,
          message: updateError.message || 'An error occurred during password reset.',
        }
      }

      // Update profile status back to registered
      const { error: statusError } = await supabase
        .from('profile')
        .update({ status: 'registered' })
        .eq('id', profileData.id)

      if (statusError) {
        console.error('[SERVER] Error updating profile status:', statusError)
      }

      return {
        success: true,
        message: 'Password reset complete. You can now log in with your new password.',
      }
    } else {
      // For pending users, create new user account
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { email_confirmed: true },
      })

      if (authError) {
        return {
          success: false,
          message: authError.message || 'An error occurred during registration.',
        }
      }

      if (authData?.user?.id) {
        // Update profile with user_id and status
        const { error: updateError } = await supabase
          .from('profile')
          .update({
            user_id: authData.user.id,
            status: 'registered',
          })
          .eq('id', profileData.id)

        if (updateError) {
          console.error('[SERVER] Error updating profile with user_id:', updateError)
        }
      }

      return {
        success: true,
        message: 'Registration complete. You can now log in.',
      }
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
        status: 'pending',
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

export async function getProfiles(): Promise<GetProfilesResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[SERVER] Error fetching profiles:', error)
      return {
        users: null,
        success: false,
        message: `Error fetching profiles: ${error.message}`,
      }
    }

    return {
      users: data || [],
      success: true,
    }
  } catch (error) {
    console.error('[SERVER] Unexpected error fetching profiles:', error)
    return {
      users: null,
      success: false,
      message: 'An unexpected error occurred while fetching profiles.',
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

export async function resetUserPassword(profileId: string): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Check if current user is admin
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

    // Update profile status to reset_password
    const { error: updateError } = await supabase.from('profile').update({ status: 'reset_password' }).eq('id', profileId)

    if (updateError) {
      console.error('[SERVER] Error updating profile status:', updateError)
      return {
        success: false,
        message: `Error updating profile: ${updateError.message}`,
      }
    }

    return {
      success: true,
      message: 'Password reset initiated. User can now set a new password.',
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error in resetUserPassword:', errorMessage)
    return {
      success: false,
      message: `Errore imprevisto: ${errorMessage}`,
    }
  }
}

export async function getUserProfile(userId: string): Promise<ProfileUser | null> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[SERVER] Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[SERVER] Unexpected error fetching user profile:', error)
    return null
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

    const { data: profileData, error: profileError } = await supabase
      .from('profile')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !profileData?.is_admin) {
      return {
        users: null,
        success: false,
        message: 'You do not have the necessary permissions to access this feature',
      }
    }

    const { data: allProfiles, error: fetchError } = await supabase
      .from('profile')
      .select('id, email, created_at, user_id, is_admin, status')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[SERVER] Error fetching profiles:', fetchError)
      return {
        users: null,
        success: false,
        message: `Errore nel recupero degli utenti: ${fetchError.message}`,
      }
    }

    return {
      users: allProfiles || [],
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
