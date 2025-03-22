import Deliveries from '@/components/deliveries/deliveries'
import { iAmAdmin } from '@/actions/admin'

export default async function DeliveriesPage() {
  // Checking admin status on the server
  const isAdmin = await iAmAdmin()
  
  return <Deliveries isAdmin={isAdmin} />
}
