'use client'

import { MoreVertical } from 'lucide-react'
import { Check } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Info } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/context/authContext'
import { useDelivery } from '@/context/deliveryContext'
import { useTranslation } from '@/i18n/I18nProvider'

export default function SetStatus() {
  const { delivery, changeStatus, refreshDelivery, sendStatusEmail } = useDelivery()
  const { isAdmin, user } = useAuth()
  const [changingStatus, setChangingStatus] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [pendingAction, setPendingAction] = useState<'complete' | 'cancel' | null>(null)

  const { t } = useTranslation()

  if (!delivery) return null

  // Check if delivery is completed or cancelled and user is not admin
  const isDeliveryFinalized = delivery.status === 'completed' || delivery.status === 'cancelled'
  const isOwner = user?.email === delivery.user?.email

  const handleCompleteClick = () => {
    setShowCompleteDialog(true)
  }

  const handleCompleteConfirm = async () => {
    setShowCompleteDialog(false)
    setPendingAction('complete')
    setShowEmailDialog(true)
  }

  const handleCancelClick = () => {
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    setShowCancelDialog(false)
    setPendingAction('cancel')
    setShowEmailDialog(true)
  }

  const handleEmailConfirm = async () => {
    setSendingEmail(true)
    setChangingStatus(true)
    try {
      // First change the status
      if (pendingAction === 'complete') {
        await changeStatus('completed')
      } else if (pendingAction === 'cancel') {
        await changeStatus('cancelled')
      }

      await refreshDelivery()

      // Then send the email
      if (pendingAction === 'complete') {
        await sendStatusEmail('completion')
      } else if (pendingAction === 'cancel') {
        await sendStatusEmail('cancellation')
      }
    } catch (error) {
      console.error('Error processing action:', error)
    } finally {
      setSendingEmail(false)
      setChangingStatus(false)
      setShowEmailDialog(false)
      setPendingAction(null)
    }
  }

  const handleEmailSkip = async () => {
    setChangingStatus(true)
    try {
      // Change the status without sending email
      if (pendingAction === 'complete') {
        await changeStatus('completed')
      } else if (pendingAction === 'cancel') {
        await changeStatus('cancelled')
      }

      await refreshDelivery()
    } catch (error) {
      console.error('Error processing action:', error)
    } finally {
      setChangingStatus(false)
      setShowEmailDialog(false)
      setPendingAction(null)
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* Info messages for different permission scenarios */}
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
                <h4 className='font-medium leading-none'>{t('deliveries.statusFinalized') || 'Consegna finalizzata'}</h4>
                <p className='text-sm text-muted-foreground'>{t('deliveries.statusFinalizedDescription') || 'Solo gli admin possono modificare lo stato di una consegna finalizzata.'}</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {!isAdmin && !isOwner && (
        <div className='flex items-center'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-auto p-1 text-blue-600 hover:text-blue-700'
              >
                <Info className='h-4 w-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80'>
              <div className='space-y-2'>
                <h4 className='font-medium leading-none'>{t('deliveries.notOwner') || 'Non proprietario'}</h4>
                <p className='text-sm text-muted-foreground'>{t('deliveries.notOwnerDescription') || 'Solo gli admin possono modificare le consegne create da altri utenti.'}</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Show buttons for admins (always) or for owners of non-finalized deliveries */}
      {(isAdmin || (isOwner && !isDeliveryFinalized)) && (
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={handleCompleteClick}
              disabled={changingStatus || sendingEmail}
            >
              {changingStatus || sendingEmail ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Check className='h-4 w-4 mr-2' />}
              {t('deliveries.statusText.completed')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={changingStatus || sendingEmail}
                >
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={async () => {
                    setChangingStatus(true)
                    try {
                      await changeStatus('pending')
                      await refreshDelivery()
                    } finally {
                      setChangingStatus(false)
                    }
                  }}
                  disabled={changingStatus || sendingEmail}
                >
                  {t('deliveries.statusText.pending')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCancelClick}
                  disabled={changingStatus || sendingEmail}
                >
                  {t('deliveries.statusText.cancelled')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Complete confirmation dialog */}
      <Dialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deliveries.confirmCompletion') || 'Conferma Completamento'}</DialogTitle>
            <DialogDescription>
              {isAdmin 
                ? (t('deliveries.confirmCompletionDescriptionAdmin') || `Sei sicuro di voler completare la consegna #${delivery.id}?`)
                : (t('deliveries.confirmCompletionDescription') || `Sei sicuro di voler completare la consegna #${delivery.id}? Questa azione non può essere annullata.`)
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowCompleteDialog(false)}
              disabled={changingStatus || sendingEmail}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCompleteConfirm}
              disabled={changingStatus}
            >
              {t('deliveries.statusText.completed')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deliveries.confirmCancellation') || 'Conferma Annullamento'}</DialogTitle>
            <DialogDescription>
              {isAdmin 
                ? (t('deliveries.confirmCancellationDescriptionAdmin') || `Sei sicuro di voler annullare la consegna #${delivery.id}?`)
                : (t('deliveries.confirmCancellationDescription') || `Sei sicuro di voler annullare la consegna #${delivery.id}? Questa azione non può essere annullata.`)
              }
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowCancelDialog(false)}
              disabled={changingStatus || sendingEmail}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleCancelConfirm}
              disabled={changingStatus}
            >
              {t('deliveries.statusText.cancelled')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email confirmation dialog */}
      <Dialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('notifications.sendEmailConfirmation') || 'Invia notifica email'}</DialogTitle>
            <DialogDescription>
              {(t('notifications.sendEmailConfirmationDescription') || `Vuoi inviare una notifica email al destinatario {recipientEmail}?`).replace('{recipientEmail}', delivery.recipientEmail)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={handleEmailSkip}
              disabled={sendingEmail || changingStatus}
            >
              {changingStatus ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  {t('common.loading') || 'Caricamento...'}
                </>
              ) : (
                t('notifications.skipEmail') || 'Salta Email'
              )}
            </Button>
            <Button
              onClick={handleEmailConfirm}
              disabled={sendingEmail || changingStatus}
            >
              {sendingEmail || changingStatus ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  {t('common.loading') || 'Caricamento...'}
                </>
              ) : (
                t('notifications.sendEmail') || 'Invia Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
