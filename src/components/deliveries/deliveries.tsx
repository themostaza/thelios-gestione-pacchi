'use client'

import { Filter } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import DeliveryFilterPanel from '@/components/deliveries/deliveriesFilters'
import DeliveriesTable from '@/components/deliveries/deliveriesTable'
import DeliveryStatusFilter from '@/components/deliveries/deliveryStatusFilter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DeliveriesProvider } from '@/context/deliveriesContext'

interface DeliveriesProps {
  isAdmin: boolean
}

export default function Deliveries({ isAdmin }: DeliveriesProps) {
  return (
    <DeliveriesProvider>
      <Card className='w-full flex flex-col'>
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
          <div className='flex flex-col h-full overflow-hidden'>
            <DeliveriesTable showFilters={false} />
          </div>
        </CardContent>
        </div>
      </Card>
    </DeliveriesProvider>
  )
}