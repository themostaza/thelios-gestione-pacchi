import { Metadata } from 'next'

import UserManagement from '@/components/user/accountManagement'

export const metadata: Metadata = {
  title: 'Accounts',
  description: 'Manage accounts',
}

export default function AccountsPage() {
  return <UserManagement />
}
