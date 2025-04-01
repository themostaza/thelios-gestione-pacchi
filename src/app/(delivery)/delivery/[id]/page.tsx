import DeliveryView from '@/components/delivery/DeliveryView'
import { getDictionary } from '@/i18n/dictionaries'
import { staticLocale } from '@/i18n/config'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)
  
  return {
    title: dict.common.siteTitle,
    description: dict.common.siteDescription,
  }
}

interface DeliveryPageProps {
  params: Promise<{ id: string }>
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  const { id } = await params

  return <DeliveryView deliveryId={id} />
}
