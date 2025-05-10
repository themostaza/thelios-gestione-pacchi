'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

import AuthStatus from '@/components/authStatus'
import NavigationButtons from '@/components/NavigationButtons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/visually-hidden'

export default function TopBar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile view - sheet sidebar */}
      <Sheet
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SheetTrigger
          asChild
          className='lg:hidden fixed top-4 right-4 z-40'
        >
          <Button
            variant='outline'
            size='icon'
          >
            <Menu className='h-4 w-4' />
          </Button>
        </SheetTrigger>
        <SheetContent
          side='left'
          className='w-full p-4 bg-secondary'
        >
          <SheetTitle className='flex justify-center mb-2'>
            <Image
                src="/logo.avif"
                alt="Logo"
                width={120}
                height={40}
                priority
              />
          </SheetTitle>
          <div className='flex flex-col justify-between gap-4 py-4'>
            <NavigationButtons onNavigate={() => setIsOpen(false)} />
            <AuthStatus />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop view - permanent sidebar */}
      <div className='hidden lg:flex flex-col justify-between h-screen bg-secondary p-4 gap-4 w-1/4'>
        <div className="flex flex-col justify-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.avif"
              alt="Logo"
              width={120}
              height={40}
              priority
            />
          </div>
          <NavigationButtons />
        </div>
        <AuthStatus />
      </div>
    </>
  )
}
