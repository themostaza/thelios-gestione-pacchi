'use server'

import { checkAdminStatus } from '@/lib/admin-utils'

/**
 * Server action to check if the current user has admin privileges
 */
export async function iAmAdmin() {
  return await checkAdminStatus()
}
