'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import DeliveryDetails from './DeliveryDetails'
import DeliveryActions from './DeliveryActions'
import DeliveryFooter from './DeliveryFooter'
import { DeliveryProvider } from '@/context/deliveryContext'
import { Separator } from '../ui/separator'

export default function DeliveryView({ id }: { id: string }) {
  const deliveryId = id as string

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