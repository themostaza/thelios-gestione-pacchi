import UserManagement from '@/components/user/accountManagement'
import { getDictionary } from '@/i18n/dictionaries'
import { staticLocale } from '@/i18n/config'

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
