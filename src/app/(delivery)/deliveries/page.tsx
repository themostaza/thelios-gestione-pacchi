import { iAmAdmin } from '@/actions/admin'
import Deliveries from '@/components/deliveries/deliveries'

export default async function DeliveriesPage() {
  // Checking admin status on the server
  const isAdmin = await iAmAdmin()

  return <Deliveries isAdmin={isAdmin} />
}
