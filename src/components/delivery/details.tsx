import { Badge } from '@/components/ui/badge'
import { useDelivery } from '@/context/deliveryContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function DeliveryDetails() {
  const { delivery } = useDelivery()
  const { t } = useTranslation()

  // Simula lo stato di loading: sostituisci con la tua logica reale
  const isLoading = !delivery

  if (isLoading) {
    return (
      <div className='grid lg:grid-cols-2 gap-6 animate-pulse'>
        <div>
          <div className='h-6 w-40 bg-muted rounded mb-4' />
          <div className='space-y-3 mt-3'>
            <div>
              <div className='h-4 w-28 bg-muted rounded mb-1' />
              <div className='h-5 w-32 bg-muted rounded' />
            </div>
            <div>
              <div className='h-4 w-28 bg-muted rounded mb-1' />
              <div className='h-6 w-24 bg-muted rounded' />
            </div>
            <div>
              <div className='h-4 w-40 bg-muted rounded mb-1' />
              <div className='h-5 w-48 bg-muted rounded' />
            </div>
            <div>
              <div className='h-4 w-28 bg-muted rounded mb-1' />
              <div className='h-5 w-40 bg-muted rounded' />
            </div>
          </div>
        </div>
        <div>
          <div className='h-6 w-40 bg-muted rounded mb-4' />
          <div className='space-y-3 mt-3'>
            <div>
              <div className='h-4 w-32 bg-muted rounded mb-1' />
              <div className='h-5 w-40 bg-muted rounded' />
            </div>
            <div>
              <div className='h-4 w-32 bg-muted rounded mb-1' />
              <div className='h-5 w-40 bg-muted rounded' />
            </div>
            <div>
              <div className='h-4 w-28 bg-muted rounded mb-1' />
              <div className='h-5 w-48 bg-muted rounded' />
            </div>
            <div>
              <div className='h-4 w-24 bg-muted rounded mb-1' />
              <div className='h-5 w-56 bg-muted rounded' />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!delivery) return null

  return (
    <div className='grid lg:grid-cols-2 gap-6'>
      <div>
        <h3 className='text-lg font-medium'>{t('deliveries.title')}</h3>
        <div className='space-y-3 mt-3'>
          <div>
            <p className='text-sm text-muted-foreground'>{t('deliveries.id')}</p>
            <p className='font-medium'>{delivery.id}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>{t('common.status')}</p>
            <div className='mt-1'>
              <Badge className={delivery.status === 'completed' ? 'bg-green-500' : delivery.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}>
                {t(`deliveries.statusText.${delivery.status}`)}
              </Badge>
            </div>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>{t('notifications.recipientEmail')}</p>
            <p className='font-medium'>{delivery.recipientEmail}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>{t('deliveries.place')}</p>
            <p className='font-medium'>{delivery.place}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium'>{t('common.info')}</h3>
        <div className='space-y-3 mt-3'>
          <div>
            <p className='text-sm text-muted-foreground'>{t('deliveries.created')}</p>
            <p className='font-medium'>{new Date(delivery.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>{t('deliveries.completed_at')}</p>
            {delivery.completed_at ? <p className='font-medium'>{new Date(delivery.completed_at).toLocaleString()}</p> : <p className='font-medium text-destructive'>{t('common.notCompleted')}</p>}
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>{t('user.email')}</p>
            <p className='font-medium'>{delivery.user.email}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>{t('common.notes')}</p>
            <p className='font-medium'>{delivery.notes || t('common.optionalNotes')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
