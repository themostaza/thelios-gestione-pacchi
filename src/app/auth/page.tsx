import AuthView from '@/components/auth/AuthView'
import { getDictionary } from '@/i18n/dictionaries'
import { staticLocale } from '@/i18n/config'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)
  
  return {
    title: dict.common.siteTitle,
    description: dict.common.siteDescription,
  }
}

export default function AuthPage() {
  return <AuthView />
}
