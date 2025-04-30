'use client'

import DeliverySetStatus from '@/components/delivery/setStatus'
import DeliveryDetails from '@/components/delivery/DeliveryDetails'
import DeliveryFooter from '@/components/delivery/DeliveryFooter'
import GenericCardView from '@/components/GenericCardView'
import { DeliveryProvider } from '@/context/deliveryContext'

interface DeliveryViewProps {
  deliveryId: string
}

export default function DeliveryView({ deliveryId }: DeliveryViewProps) {
  return (
    <DeliveryProvider deliveryId={deliveryId}>
      <GenericCardView
        title='Delivery Details'
        description={`View and manage delivery #${deliveryId}`}
        headerRight={<DeliverySetStatus />}
        footer={<DeliveryFooter />}
      >
        <DeliveryDetails />
      </GenericCardView>
    </DeliveryProvider>
  )
}
