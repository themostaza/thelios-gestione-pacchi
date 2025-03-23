'use client'

import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import DeliveryFilterPanel from '@/components/deliveries/deliveriesFilters'
import DeliveriesTable from '@/components/deliveries/deliveriesTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DeliveriesProvider } from '@/context/deliveriesContext'

interface DeliveriesProps {
  isAdmin: boolean
}

export default function Deliveries({ isAdmin }: DeliveriesProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <DeliveriesProvider>
      <Card className='w-full flex flex-col'>
        <CardHeader>
          <div className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold'>Your Deliveries</CardTitle>
              <CardDescription className='mt-2'>Manage and monitor all your delivery requests</CardDescription>
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='default'
                size='sm'
                asChild
              >
                <Link href='/delivery/new'>New</Link>
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className='h-4 w-4 mr-2' />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>
          <Separator className='mt-4' />
        </CardHeader>

        <CardContent className='flex-1 overflow-hidden'>
          <div className='flex flex-col md:flex-row gap-4 h-full'>
            <div className={`${showFilters ? 'md:w-3/4' : 'w-full'} flex flex-col h-full overflow-hidden`}>
              <DeliveriesTable showFilters={showFilters} />
            </div>

            {showFilters && (
              <div className='md:w-1/4 mb-4 md:mb-0 border-l pl-4'>
                <DeliveryFilterPanel isAdmin={isAdmin} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DeliveriesProvider>
  )
}
