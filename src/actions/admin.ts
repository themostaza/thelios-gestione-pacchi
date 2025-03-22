'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Server action to check if the current user has admin privileges
 * @returns Boolean indicating if user is an admin
 */
export async function iAmAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }
  
  // Check if user is admin
  const { data: adminData } = await supabase
    .from('profile')
    .select('user_id, is_admin')
    .eq('user_id', user.id)
    .single()

  const isAdmin = adminData?.is_admin
  
  return isAdmin
} 