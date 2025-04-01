import { getDictionary } from '@/i18n/dictionaries'
import { staticLocale } from '@/i18n/config'

import { currentUserIsAdmin } from '@/app/actions/authActions'
import Deliveries from '@/components/deliveries/deliveries'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)
  
  return {
    title: dict.common.siteTitle,
    description: dict.common.siteDescription,
  }
}

export default async function DeliveriesPage() {
  const isAdmin = await currentUserIsAdmin()

  return <Deliveries isAdmin={isAdmin} />
}
