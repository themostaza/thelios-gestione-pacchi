'use client'

import DeliveryDetails from '@/components/delivery/details'
import DeliveryFooter from '@/components/delivery/footer'
import DeliveryStatusSetter from '@/components/delivery/statusSetter'
import GenericCardView from '@/components/genericCardView'
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
        headerRight={<DeliveryStatusSetter />}
        footer={<DeliveryFooter />}
      >
        <DeliveryDetails />
      </GenericCardView>
    </DeliveryProvider>
  )
}
