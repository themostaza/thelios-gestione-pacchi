import UserManagement from '@/components/accounts/accountManagement'
import { staticLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)

  return {
    title: `${dict.user.management} - ${dict.common.siteTitle}`,
    description: dict.common.siteDescription,
  }
}

export default async function AccountsPage() {
  return <UserManagement />
}
