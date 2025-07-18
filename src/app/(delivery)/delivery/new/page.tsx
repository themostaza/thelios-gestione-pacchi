import DeliveryForm from '@/components/delivery/form'
import { staticLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)

  return {
    title: `${dict.deliveries.newDelivery} - ${dict.common.siteTitle}`,
    description: dict.common.siteDescription,
  }
}

export default function DeliveryPage() {
  return <DeliveryForm />
}
