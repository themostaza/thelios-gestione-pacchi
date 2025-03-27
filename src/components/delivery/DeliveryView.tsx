'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { DeliveryProvider } from '@/context/deliveryContext'

import { Separator } from '../ui/separator'

import DeliveryActions from './DeliveryActions'
import DeliveryDetails from './DeliveryDetails'
import DeliveryFooter from './DeliveryFooter'

type DeliveryViewProps = {
  deliveryId: string
}

export default function DeliveryView({ deliveryId }: DeliveryViewProps) {
  return (
    <DeliveryProvider deliveryId={deliveryId}>
      <Card className='w-full flex flex-col'>
        <CardHeader>
          <div className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold'>Delivery Details</CardTitle>
              <CardDescription className='mt-2'>View and manage delivery #{deliveryId}</CardDescription>
            </div>
            <DeliveryActions />
          </div>
          <Separator className='mt-4' />
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden'>
          <DeliveryDetails />
        </CardContent>
        <CardFooter className='flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t pt-6'>
          <DeliveryFooter />
        </CardFooter>
      </Card>
    </DeliveryProvider>
  )
}
