'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { getDeliveriesPaginated } from '@/app/actions/deliveryActions'
import { DeliveryData, DeliveryFilters, FilterFormValues, DeliveriesContextType } from '@/lib/types/delivery'

const DeliveriesContext = createContext<DeliveriesContextType | undefined>(undefined)

export function DeliveriesProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<DeliveryFilters>({
    status: ['pending', 'completed', 'cancelled'],
  })

  const form = useForm<FilterFormValues>({
    defaultValues: {
      recipient: '',
      sender: '',
      statusFilters: {
        pending: true,
        completed: true,
        cancelled: true,
        error: false,
      },
      dateRange: undefined,
    },
  })

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true)

        const response = await getDeliveriesPaginated(page, 10, filters)

        if (response.success && response.data) {
          if (page === 1) {
            setDeliveries(response.data)
          } else {
            setDeliveries((prev) => [...prev, ...response.data!])
          }
          setHasMore(response.hasMore)
          setError(null)
        } else {
          setError(response.message)
        }
      } catch (err) {
        setError('Error during delivery loading')
        console.error(err)
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    }

    loadDeliveries()
  }, [page, filters])

  const applyFilters = (values: FilterFormValues) => {
    const selectedStatuses = Object.entries(values.statusFilters)
      .filter(([, isSelected]) => isSelected)
      .map(([status]) => status)

    const newFilters: DeliveryFilters = {}

    if (values.recipient.trim()) {
      newFilters.recipientEmail = values.recipient
    }

    if (values.sender.trim()) {
      newFilters.userEmail = values.sender
    }

    if (selectedStatuses.length > 0) {
      newFilters.status = selectedStatuses
    }

    if (values.dateRange?.from) {
      const startOfDay = new Date(values.dateRange.from)
      startOfDay.setHours(0, 0, 0, 0)
      newFilters.startDate = startOfDay.toISOString()
    }

    if (values.dateRange?.to) {
      const endOfDay = new Date(values.dateRange.to)
      endOfDay.setHours(23, 59, 59, 999)
      newFilters.endDate = endOfDay.toISOString()
    }

    setFilters(newFilters)
    setPage(1)
  }

  const resetFilters = () => {
    const defaultStatusFilters = {
      pending: true,
      completed: true,
      cancelled: true,
      error: false,
    }

    form.reset({
      recipient: '',
      sender: '',
      statusFilters: defaultStatusFilters,
      dateRange: undefined,
    })
    setFilters({
      status: ['pending', 'completed', 'cancelled'],
    })
    setPage(1)
  }

  const toggleStatusFilter = (status: string) => {
    const updatedFilters = {
      ...form.getValues().statusFilters,
      [status]: !form.getValues().statusFilters[status],
    }

    form.setValue('statusFilters', updatedFilters)
  }

  return (
    <DeliveriesContext.Provider
      value={{
        deliveries,
        page,
        setPage,
        hasMore,
        loading,
        initialLoading,
        error,
        filters,
        form,
        applyFilters,
        resetFilters,
        toggleStatusFilter,
      }}
    >
      {children}
    </DeliveriesContext.Provider>
  )
}

export const useDeliveries = () => {
  const context = useContext(DeliveriesContext)
  if (context === undefined) {
    throw new Error('useDeliveries must be used within a DeliveriesProvider')
  }
  return context
}
