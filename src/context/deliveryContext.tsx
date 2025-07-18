'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

import { getDeliveryById, getDeliveryReminders, updateDeliveryStatus, sendReminderEmail, sendStatusEmail } from '@/app/actions/deliveryActions'
import { StatusType } from '@/components/ui/statusBadge'
import { DeliveryData, ReminderLog } from '@/lib/types/delivery'

type DeliveryContextType = {
  delivery: DeliveryData | null
  loading: boolean
  error: string | null
  emailLogs: ReminderLog[]
  isPolling: boolean
  changeStatus: (newStatus: StatusType) => Promise<void>
  sendReminder: () => Promise<void>
  sendStatusEmail: (emailType: 'completion' | 'cancellation') => Promise<void>
  refreshDelivery: () => Promise<void>
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined)

export function DeliveryProvider({ children, deliveryId }: { children: ReactNode; deliveryId: string }) {
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailLogs, setEmailLogs] = useState<ReminderLog[]>([])

  const loadDelivery = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getDeliveryById(deliveryId)
      if (result.success) {
        setDelivery(result.data)

        const remindersResult = await getDeliveryReminders(deliveryId)
        if (remindersResult.success) {
          setEmailLogs(remindersResult.data || [])
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to load delivery details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [deliveryId])

  useEffect(() => {
    loadDelivery()
  }, [loadDelivery])

  const refreshDelivery = async () => {
    await loadDelivery()
  }

  const changeStatus = async (newStatus: StatusType) => {
    try {
      const result = await updateDeliveryStatus(deliveryId, newStatus)
      if (result.success) {
        setDelivery((prev) => (prev ? { ...prev, status: newStatus } : null))
      } else {
        setError(result.message || 'Failed to update status')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while updating the status')
    }
  }

  const sendReminder = async () => {
    if (!delivery) return

    try {
      const result = await sendReminderEmail(deliveryId)
      await refreshDelivery()
      if (!result.success) {
        setError(result.message || 'Failed to send reminder')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while sending the reminder')
    }
  }

  const sendStatusEmailContext = async (emailType: 'completion' | 'cancellation') => {
    if (!delivery) return

    try {
      const result = await sendStatusEmail(deliveryId, emailType)
      await refreshDelivery()
      if (!result.success) {
        setError(result.message || 'Failed to send status email')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while sending the status email')
    }
  }

  return (
    <DeliveryContext.Provider value={{ delivery, loading, error, emailLogs, isPolling: loading, changeStatus, sendReminder, sendStatusEmail: sendStatusEmailContext, refreshDelivery }}>
      {children}
    </DeliveryContext.Provider>
  )
}

export const useDelivery = () => {
  const context = useContext(DeliveryContext)
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider')
  }
  return context
}
