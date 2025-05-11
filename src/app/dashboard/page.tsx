import DashboardComponent from '@/components/dashboard/component'
import { staticLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)

  return {
    title: `${dict.dashboard.title}`,
    description: dict.dashboard.description,
  }
}

export default async function DashboardPage() {
  return <DashboardComponent />
}
