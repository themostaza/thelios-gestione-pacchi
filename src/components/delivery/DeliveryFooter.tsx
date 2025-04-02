import { Mail } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDelivery } from '@/context/deliveryContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function DeliveryFooter() {
  const { t } = useTranslation()
  const { emailLogs, sendReminder } = useDelivery()
  const [sendingReminder, setSendingReminder] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)

  const handleSendReminder = async () => {
    setSendingReminder(true)
    await sendReminder()
    setSendingReminder(false)
  }

  return (
    <>
      <div className='w-full bg-primary/10 rounded-lg p-4'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <h3 className='text-lg font-medium'>{t('notifications.emailNotifications')}</h3>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setLogsDialogOpen(true)}
            >
              {t('notifications.viewLogs')}
            </Button>
          </div>
          <div className='flex items-center gap-2'>
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
            <Button
              onClick={handleSendReminder}
              disabled={sendingReminder}
            >
              {sendingReminder ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Mail className='h-4 w-4 mr-2' />}
              {t('notifications.sendReminder')}
            </Button>
          </div>
        </div>
      </div>

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

          <div className='max-h-[60vh] overflow-y-auto mt-4'>
            <div className='space-y-3'>
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
