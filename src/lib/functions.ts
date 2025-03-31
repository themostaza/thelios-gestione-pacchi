import { cookies } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

export async function currentUserIsAdmin(): Promise<boolean> {
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
