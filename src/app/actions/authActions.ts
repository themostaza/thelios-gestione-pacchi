'use server'

import { User } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

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

export async function registerUser(email: string, password: string): Promise<RegisterResult> {
  try {
    console.log('[SERVER] registerUser - Starting with email:', email)

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // 1. Verifica se esiste un profilo con questa email
    console.log('[SERVER] Checking if profile exists')
    const { data: profileData, error: profileError } = await supabase.from('profile').select('*').eq('email', email)

    console.log('[SERVER] Profile check result:', {
      profileFound: !!profileData && profileData.length > 0,
      error: profileError ? profileError.message : null,
    })

    if (profileError) {
      return {
        success: false,
        message: `Errore nel verificare il profilo: ${profileError.message}`,
      }
    }

    if (!profileData || profileData.length === 0) {
      return {
        success: false,
        message: "L'indirizzo email non è stato pre-autorizzato. Contatta l'amministratore.",
      }
    }

    // 2. Se esiste un profilo, procedi con la registrazione
    console.log('[SERVER] Proceeding with auth signup')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    console.log('[SERVER] Auth signup result:', {
      success: !!authData && !authError,
      error: authError ? authError.message : null,
    })

    if (authError) {
      return {
        success: false,
        message: authError.message || 'Si è verificato un errore durante la registrazione.',
      }
    }

    // 3. Aggiorna il profilo con l'user_id del nuovo utente registrato
    if (authData?.user?.id) {
      console.log('[SERVER] Updating profile with new user_id:', authData.user.id)
      const { error: updateError } = await supabase.from('profile').update({ user_id: authData.user.id }).eq('email', email)

      if (updateError) {
        console.error('[SERVER] Error updating profile with user_id:', updateError)
        // Non facciamo fallire la registrazione, ma logghiamo l'errore
      } else {
        console.log('[SERVER] Profile successfully updated with user_id')
      }
    }

    return {
      success: true,
      message: "Registrazione completata. Ti abbiamo inviato un'email di conferma.",
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error during registration:', errorMessage)
    return {
      success: false,
      message: `Errore durante la registrazione: ${errorMessage}`,
    }
  }
}

export async function logoutUser(): Promise<LogoutResult> {
  try {
    console.log('[SERVER] logoutUser - Starting logout process')

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.signOut()

    console.log('[SERVER] Logout result:', error ? 'Error: ' + error.message : 'Success')

    if (error) {
      return {
        success: false,
        message: `Error during logout: ${error.message}`,
      }
    }

    revalidatePath('/')
    // Perform server-side redirect
    redirect('/')

    // This code will not be reached due to the redirect
    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    console.error('[SERVER] Unexpected error during logout:', errorMessage)
    return {
      success: false,
      message: `Error during logout: ${errorMessage}`,
    }
  }
}

export async function getUserSession(): Promise<UserSessionResult> {
  try {
    console.log('[SERVER] getUserSession - Getting current user')

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('[SERVER] No user session found')
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
      console.log('[SERVER] No profile found by user_id, trying by email:', user.email)

      const emailResult = await supabase.from('profile').select('is_admin, email, user_id').eq('email', user.email).maybeSingle()

      if (emailResult.data && !emailResult.error) {
        profileData = emailResult.data
        profileError = null

        // Update the profile with the correct user_id if it's missing
        if (profileData && (!profileData.user_id || profileData.user_id !== user.id)) {
          console.log('[SERVER] Updating profile with correct user_id:', user.id)

          const updateResult = await supabase.from('profile').update({ user_id: user.id }).eq('email', user.email)

          if (updateResult.error) {
            console.error('[SERVER] Error updating profile with user_id:', updateResult.error)
          } else {
            console.log('[SERVER] Profile successfully updated with user_id')
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

    console.log('[SERVER] User session retrieved with admin status:', !!profileData?.is_admin)

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
