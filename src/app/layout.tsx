import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import Menu from '@/components/menu'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/authContext'
import { staticLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { I18nProvider } from '@/i18n/I18nProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateMetadata() {
  const dict = await getDictionary(staticLocale)

  return {
    title: dict.common.siteTitle,
    description: dict.common.siteDescription,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='it'>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen h-full md:h-screen bg-primary/20 md:flex`}>
        <I18nProvider>
          <AuthProvider>
            <Menu />
            <div className='mx-auto min-h-screen h-full flex max-w-screen-xl w-full p-1 md:p-4'>{children}</div>
            <Toaster />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
