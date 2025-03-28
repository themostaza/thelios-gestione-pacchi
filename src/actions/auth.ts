'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

type LoginFormData = {
  email: string
  password: string
}

type LoginResult = {
  success: boolean
  error?: string
}

async function checkProfileExists(userId: string, userEmail: string): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // First check if profile exists with user_id
    const { data: profile, error: fetchError } = await supabase.from('profile').select('*').eq('user_id', userId).single()

    if (profile) {
      // Profile exists with this user_id
      return true
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking profile by user_id:', fetchError)
      return false
    }

    // If no profile with user_id, check for profile with matching email and no user_id
    const { data: emailProfile, error: emailFetchError } = await supabase.from('profile').select('*').eq('email', userEmail).is('user_id', null).single()

    if (emailFetchError && emailFetchError.code !== 'PGRST116') {
      console.error('Error checking profile by email:', emailFetchError)
      return false
    }

    if (emailProfile) {
      // Found a profile with matching email and no user_id, update it
      const { error: updateError } = await supabase.from('profile').update({ user_id: userId }).eq('id', emailProfile.id)

      if (updateError) {
        console.error('Error updating profile with user_id:', updateError)
        return false
      }

      return true // Successfully updated profile
    }

    // No matching profile found
    return false
  } catch (error) {
    console.error('Profile check error:', error)
    return false
  }
}

export async function loginUser(data: LoginFormData): Promise<LoginResult> {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Attempt to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Invalid login credentials',
      }
    }

    // Get the current user after successful login
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Authentication successful but no user found',
      }
    }

    // Check if profile exists with user ID or email
    const profileExists = await checkProfileExists(user.id, user.email || '')

    if (!profileExists) {
      // Profile doesn't exist, prevent login
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Your account is not authorized to use this application.',
      }
    }

    revalidatePath('/', 'layout') // Revalidate the entire app from the root layout

    return { success: true }
  } catch (error) {
    console.error('Server login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
