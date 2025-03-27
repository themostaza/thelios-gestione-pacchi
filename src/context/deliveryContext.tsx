'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getDeliveryById, getDeliveryReminders, updateDeliveryStatus, sendReminderEmail } from '@/app/actions/deliveryActions'
import { DeliveryData, ReminderLog } from '@/app/actions/deliveryActions'

type DeliveryContextType = {
  delivery: DeliveryData | null
  loading: boolean
  error: string | null
  emailLogs: ReminderLog[]
  changeStatus: (newStatus: string) => Promise<void>
  sendReminder: () => Promise<void>
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined)

export function DeliveryProvider({ children, deliveryId }: { children: ReactNode, deliveryId: string }) {
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailLogs, setEmailLogs] = useState<ReminderLog[]>([])

  useEffect(() => {
    async function loadDelivery() {
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
    }

    loadDelivery()
  }, [deliveryId])

  const changeStatus = async (newStatus: string) => {
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
      const result = await sendReminderEmail(deliveryId, delivery.recipientEmail)
      if (result.success && result.data) {
        setEmailLogs((prev) => [result.data, ...prev])
      } else {
        setError(result.message || 'Failed to send reminder')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while sending the reminder')
    }
  }

  return (
    <DeliveryContext.Provider value={{ delivery, loading, error, emailLogs, changeStatus, sendReminder }}>
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