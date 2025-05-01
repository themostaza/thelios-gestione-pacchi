import { Badge } from '@/components/ui/badge'
import { useDelivery } from '@/context/deliveryContext'

export default function DeliveryDetails() {
  const { delivery } = useDelivery()

  if (!delivery) return null

  return (
    <div className='grid lg:grid-cols-2 gap-6'>
      <div>
        <h3 className='text-lg font-medium'>Delivery Information</h3>
        <div className='space-y-3 mt-3'>
          <div>
            <p className='text-sm text-muted-foreground'>Identifier</p>
            <p className='font-medium'>{delivery.id}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Status</p>
            <div className='mt-1'>
              <Badge className={delivery.status === 'completed' ? 'bg-green-600' : delivery.status === 'cancelled' ? 'bg-red-600' : 'bg-yellow-600'}>
                {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Recipient Email</p>
            <p className='font-medium'>{delivery.recipientEmail}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Delivery Location</p>
            <p className='font-medium'>{delivery.place}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium'>Additional Details</h3>
        <div className='space-y-3 mt-3'>
          <div>
            <p className='text-sm text-muted-foreground'>Created At</p>
            <p className='font-medium'>{new Date(delivery.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Completed At</p>
            {delivery.completed_at ? <p className='font-medium'>{new Date(delivery.completed_at).toLocaleString()}</p> : <p className='font-medium text-destructive'>Not completed</p>}
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Created By</p>
            <p className='font-medium'>{delivery.user.email}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Notes</p>
            <p className='font-medium'>{delivery.notes || 'No notes provided'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
