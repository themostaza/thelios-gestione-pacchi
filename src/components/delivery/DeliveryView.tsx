'use client'

import GenericCardView from '@/components/GenericCardView'
import { DeliveryProvider } from '@/context/deliveryContext'

import DeliveryActions from './DeliveryActions'
import DeliveryDetails from './DeliveryDetails'
import DeliveryFooter from './DeliveryFooter'

type DeliveryViewProps = {
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
