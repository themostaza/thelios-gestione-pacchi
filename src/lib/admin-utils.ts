import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

/**
 * Utility function to check if the current user has admin privileges
 * @returns Boolean indicating if user is an admin
 */
export async function checkAdminStatus() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: adminData } = await supabase.from('profile').select('user_id, is_admin').eq('user_id', user.id).single()

  return adminData?.is_admin || false
}
