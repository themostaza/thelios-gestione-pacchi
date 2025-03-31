import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import TopBar from '@/components/TopBar'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/authContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Package Delivery',
  description: 'Package Delivery',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-primary/20`}>
        <AuthProvider>
          <Toaster />
          <div className='flex flex-col h-screen'>
            <TopBar />
            <div className='flex justify-center p-2 items-stretch h-full w-full max-w-screen-xl mx-auto'>{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
