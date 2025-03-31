import { Metadata } from 'next'

import DeliveryForm from '@/components/delivery/deliveryForm'

export const metadata: Metadata = {
  title: 'New Delivery',
  description: 'Create a new delivery',
}

export default function DeliveryPage() {
  return <DeliveryForm />
}
