import { Metadata } from 'next'

import { iAmAdmin } from '@/actions/auth'
import Deliveries from '@/components/deliveries/deliveries'

export const metadata: Metadata = {
  title: 'Deliveries',
  description: 'Deliveries list',
}

export default async function DeliveriesPage() {
  const isAdmin = await iAmAdmin()

  return <Deliveries isAdmin={isAdmin} />
}
