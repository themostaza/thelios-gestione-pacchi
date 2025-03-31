import { Metadata } from 'next'

import { currentUserIsAdmin } from '@/app/actions/authActions'
import Deliveries from '@/components/deliveries/deliveries'

export const metadata: Metadata = {
  title: 'Deliveries',
  description: 'Deliveries list',
}

export default async function DeliveriesPage() {
  const isAdmin = await currentUserIsAdmin()

  return <Deliveries isAdmin={isAdmin} />
}
