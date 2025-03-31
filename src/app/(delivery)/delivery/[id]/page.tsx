import { Metadata } from 'next'

import DeliveryView from '@/components/delivery/DeliveryView'

export const metadata: Metadata = {
  title: 'Delivery',
  description: 'Delivery details',
}

interface DeliveryPageProps {
  params: Promise<{ id: string }>
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  const { id } = await params

  return <DeliveryView deliveryId={id} />
}
