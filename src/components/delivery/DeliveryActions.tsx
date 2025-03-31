'use client'

import { MoreVertical } from 'lucide-react'
import { Check } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { useDelivery } from '@/context/deliveryContext'

import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { StatusType } from '../ui/statusBadge'

export default function DeliveryActions() {
  const { delivery, changeStatus } = useDelivery()
  const [changingStatus, setChangingStatus] = useState(false)

  if (!delivery) return null

  const handleStatusChange = async (newStatus: StatusType) => {
    setChangingStatus(true)
    await changeStatus(newStatus)
    setChangingStatus(false)
  }

  return (
    <div className='flex gap-2'>
      <Button
        size='sm'
        onClick={() => handleStatusChange('completed')}
        disabled={delivery.status === 'completed' || changingStatus}
      >
        {changingStatus ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Check className='h-4 w-4 mr-2' />}
        Mark as Completed
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='sm'
          >
            <MoreVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={() => handleStatusChange('pending')}
            disabled={delivery.status === 'pending' || changingStatus}
          >
            Mark as Pending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleStatusChange('cancelled')}
            disabled={delivery.status === 'cancelled' || changingStatus}
          >
            Mark as Cancelled
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
