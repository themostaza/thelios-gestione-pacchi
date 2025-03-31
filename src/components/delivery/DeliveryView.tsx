'use client'

import GenericCardView from '@/components/GenericCardView'
import { DeliveryProvider } from '@/context/deliveryContext'

import DeliveryActions from '@/components/delivery/DeliveryActions'
import DeliveryDetails from '@/components/delivery/DeliveryDetails'
import DeliveryFooter from '@/components/delivery/DeliveryFooter'

interface DeliveryViewProps {
  deliveryId: string
}

export default function DeliveryView({ deliveryId }: DeliveryViewProps) {
  return (
    <DeliveryProvider deliveryId={deliveryId}>
      <GenericCardView
        title='Delivery Details'
        description={`View and manage delivery #${deliveryId}`}
        headerRight={<DeliveryActions />}
        footer={<DeliveryFooter />}
      >
        <DeliveryDetails />
      </GenericCardView>
    </DeliveryProvider>
  )
}
