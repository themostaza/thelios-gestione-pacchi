import { Mail } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Info } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/context/authContext'
import { useDelivery } from '@/context/deliveryContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function DeliveryFooter() {
  const { t } = useTranslation()
  const { emailLogs, sendReminder, isPolling, delivery } = useDelivery()
  const { isAdmin, user } = useAuth()
  const [sendingReminder, setSendingReminder] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)

  // Check if delivery is completed or cancelled and user is not admin
  const isDeliveryFinalized = delivery?.status === 'completed' || delivery?.status === 'cancelled'
  const isOwner = user?.email === delivery?.user?.email
  const canSendReminder = isAdmin || (isOwner && !isDeliveryFinalized)

  const handleSendReminder = async () => {
    setSendingReminder(true)
    await sendReminder()
    setSendingReminder(false)
  }

  return (
    <>
      {(isAdmin || isOwner) && (
        <div className='w-full bg-primary/10 rounded-lg p-4'>
          <div className='flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center'>
            <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
              <h3 className='text-lg font-medium'>{t('notifications.emailNotifications')}</h3>
              <Button
                variant='outline'
                size='sm'
                className='w-full mt-2 lg:w-auto lg:mt-0'
                onClick={() => setLogsDialogOpen(true)}
                disabled={isPolling}
              >
                {isPolling ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : null}
                {t('notifications.viewLogs')}
              </Button>
            </div>
            <div className='flex flex-col gap-2 w-full lg:flex-row lg:items-center lg:w-auto'>
              {!isAdmin && isOwner && isDeliveryFinalized && (
                <div className='flex items-center'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-auto p-1 text-amber-600 hover:text-amber-700'
                      >
                        <Info className='h-4 w-4' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-80'>
                      <div className='space-y-2'>
                        <h4 className='font-medium leading-none'>{t('notifications.deliveryFinalized') || 'Consegna finalizzata'}</h4>
                        <p className='text-sm text-muted-foreground'>{t('notifications.deliveryFinalizedDescription') || 'Solo gli admin possono inviare promemoria per una consegna finalizzata.'}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {emailLogs.length > 0 ? (
                <div className='flex items-center text-sm'>
                  {emailLogs[0].ok ? (
                    <div className='flex items-center text-green-600'>
                      <span className='inline-block w-2 h-2 rounded-full bg-green-600 mr-1.5'></span>
                      <span className='mr-2'>
                        {t('notifications.lastReminderSent')} • {new Date(emailLogs[0].send_at).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className='flex items-center text-red-600'>
                      <span className='inline-block w-2 h-2 rounded-full bg-red-600 mr-1.5'></span>
                      <span className='mr-2'>
                        {t('notifications.lastReminderFailed')} • {new Date(emailLogs[0].send_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-center text-sm text-muted-foreground'>
                  <span className='mr-2'>{t('notifications.noEmailsSent')}</span>
                </div>
              )}
              {canSendReminder && (
                <Button
                  onClick={handleSendReminder}
                  disabled={sendingReminder || isPolling}
                  className='w-full lg:w-auto'
                >
                  {sendingReminder || isPolling ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Mail className='h-4 w-4 mr-2' />}
                  {t('notifications.sendReminder')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs dialog */}
      <Dialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('notifications.logs')}</DialogTitle>
            <DialogDescription>{t('notifications.logsDescription')}</DialogDescription>
          </DialogHeader>

          <div className='max-h-[60vh] overflow-y-auto mt-4 relative'>
            {isPolling && (
              <div className='absolute inset-0 flex items-center justify-center bg-white/70 z-10'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
              </div>
            )}
            <div className={`space-y-3 ${isPolling ? 'opacity-50 pointer-events-none' : ''}`}>
              {emailLogs.map((log, index) => (
                <div
                  key={index}
                  className='text-sm border-l-4 pl-3 py-2 flex justify-between items-start'
                  style={{ borderColor: log.ok ? '#10b981' : '#ef4444' }}
                >
                  <div>
                    <span className={`font-medium ${log.ok ? 'text-green-600' : 'text-red-600'}`}>{log.ok ? t('common.success') : t('common.error')}</span>
                    <p className='text-muted-foreground'>{log.message}</p>
                  </div>
                  <span className='text-muted-foreground whitespace-nowrap'>{new Date(log.send_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className='mt-4'>
            <Button onClick={() => setLogsDialogOpen(false)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
