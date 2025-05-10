'use client'

import DeliveryDetails from '@/components/delivery/DeliveryDetails'
import DeliveryFooter from '@/components/delivery/DeliveryFooter'
import DeliverySetStatus from '@/components/delivery/setStatus'
import GenericCardView from '@/components/GenericCardView'
import { DeliveryProvider } from '@/context/deliveryContext'
import { useTranslation } from '@/i18n/I18nProvider'

interface DeliveryViewProps {
  deliveryId: string
}

export default function DeliveryView({ deliveryId }: DeliveryViewProps) {
  const { t } = useTranslation()

  return (
    <DeliveryProvider deliveryId={deliveryId}>
      <GenericCardView
        title={t('deliveries.title')}
        description={t('deliveries.description')}
        headerRight={<DeliverySetStatus />}
        footer={<DeliveryFooter />}
      >
        <DeliveryDetails />
      </GenericCardView>
    </DeliveryProvider>
  )
}
