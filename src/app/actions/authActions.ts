'use server'

import { User } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

type LoginData = {
  email: string
  password: string
}

type LoginResult = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
  }
}

type RegisterResult = {
  success: boolean
  message: string
}

type LogoutResult = {
  success: boolean
  message: string
}

type UserSessionResult = {
  user: User | null
  isAdmin: boolean
  error?: string
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
        error: error.message
      }
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email!
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during login'
    }
  }
}

export async function registerUser(email: string, password: string): Promise<RegisterResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // 1. First check if the user is pre-authorized
    const { data: profileData, error: profileError } = await supabase
      .from('profile')
      .select('*')
      .eq('email', email)
      .is('user_id', null)

    if (profileError) {
      return {
        success: false,
        message: `Error checking profile: ${profileError.message}`,
      }
    }

    if (!profileData || profileData.length === 0) {
      return {
        success: false,
        message: "Email not pre-authorized. Please contact administrator.",
      }
    }

    // 2. If profile exists, proceed with registration
        const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (authError) {
      return {
        success: false,
        message: authError.message || 'An error occurred during registration.',
      }
    }

    // 3. Update profile with the new user_id
    if (authData?.user?.id) {
            const { error: updateError } = await supabase
        .from('profile')
        .update({ user_id: authData.user.id })
        .eq('email', email)

      if (updateError) {
        console.error('[SERVER] Error updating profile with user_id:', updateError)
        // Don't fail registration, but log the error
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

    // This code will not be reached due to the redirect
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

export async function getUserSession(): Promise<UserSessionResult> {
  try {
    
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
            return {
        user: null,
        isAdmin: false,
        error: userError?.message,
      }
    }

    // Get profile data including admin status
    let profileData = null
    let profileError = null

    // First attempt: try to find profile by user_id
    const userIdResult = await supabase.from('profile').select('is_admin, email, user_id').eq('user_id', user.id).maybeSingle() // Use maybeSingle instead of single to handle 0 rows gracefully

    profileError = userIdResult.error
    profileData = userIdResult.data

    // If no profile found by user_id, try by email
    if (!profileData && user.email) {
      
      const emailResult = await supabase.from('profile').select('is_admin, email, user_id').eq('email', user.email).maybeSingle()

      if (emailResult.data && !emailResult.error) {
        profileData = emailResult.data
        profileError = null

        // Update the profile with the correct user_id if it's missing
        if (profileData && (!profileData.user_id || profileData.user_id !== user.id)) {
          
          const updateResult = await supabase.from('profile').update({ user_id: user.id }).eq('email', user.email)

          if (updateResult.error) {
            console.error('[SERVER] Error updating profile with user_id:', updateResult.error)
          } else {
                      }
        }
      } else {
        profileError = emailResult.error
      }
    }

    if (profileError) {
      console.error('[SERVER] Error getting profile:', profileError)
      return {
        user,
        isAdmin: false,
        error: profileError.message,
      }
    }

    
    return {
      user,
      isAdmin: !!profileData?.is_admin,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error getting user session:', errorMessage)
    return {
      user: null,
      isAdmin: false,
      error: errorMessage,
    }
  }
}
