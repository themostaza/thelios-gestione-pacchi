'use client'

import { Loader2 } from 'lucide-react'

import DeliveryFilterPanel from '@/components/deliveries/deliveriesFilters'
import DeliveriesTable from '@/components/deliveries/deliveriesTable'
import DeliveryStatusFilter from '@/components/deliveries/deliveryStatusFilter'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DeliveriesProvider, useDeliveries } from '@/context/deliveriesContext'

interface DeliveriesProps {
  isAdmin: boolean
}

function DeliveriesContent({ isAdmin }: DeliveriesProps) {
  const { loading, error } = useDeliveries()

  return (
    <>
      <CardHeader>
        <div className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-2xl font-bold'>Your Deliveries</CardTitle>
            <CardDescription className='mt-2'>Manage and monitor all your delivery requests</CardDescription>
          </div>
          <div className='flex space-x-2 justify-end items-center'>
            <DeliveryStatusFilter />
            <DeliveryFilterPanel isAdmin={isAdmin} />
          </div>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <div className='flex-1 overflow-hidden flex flex-col'>
        <CardContent className='flex-1 overflow-hidden'>
          {loading ? (
            <div className='flex flex-col items-center justify-center gap-2 h-full py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <p>Loading deliveries...</p>
            </div>
          ) : error ? (
            <div className='flex justify-center flex-col items-center py-12'>
              <p className='text-red-500'>Error: {error}</p>
            </div>
          ) : (
              <DeliveriesTable showFilters={false} />
          )}
        </CardContent>
        <CardFooter>aa</CardFooter>
      </div>
    </>
  )
}

export default function Deliveries({ isAdmin }: DeliveriesProps) {
  return (
    <DeliveriesProvider>
      <Card className='w-full flex flex-col'>
        <DeliveriesContent isAdmin={isAdmin} />
      </Card>
    </DeliveriesProvider>
  )
}
