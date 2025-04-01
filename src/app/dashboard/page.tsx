import Dashboard from '@/components/dashboard'
import { getDictionary } from '@/i18n/dictionaries'
import { staticLocale } from '@/i18n/config'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)
  
  return {
    title: `${dict.dashboard.title}`,
    description: dict.dashboard.description,
  }
}

export default async function DashboardPage() {
  return <Dashboard />
}
