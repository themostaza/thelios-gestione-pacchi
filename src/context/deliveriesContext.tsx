'use client'

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react'
import { DateRange } from 'react-day-picker'
import { useForm } from 'react-hook-form'

import { getDeliveriesPaginated, DeliveryFilters as DeliveryFiltersType, DeliveryData } from '@/app/actions/deliveryActions'

type FilterFormValues = {
  recipient: string
  sender: string
  statusFilters: Record<string, boolean>
  dateRange: DateRange | undefined
}

type DeliveriesContextType = {
  // Table related
  deliveries: DeliveryData[]
  page: number
  setPage: Dispatch<SetStateAction<number>>
  hasMore: boolean
  loading: boolean
  initialLoading: boolean
  error: string | null

  // Filter related
  filters: DeliveryFiltersType
  form: ReturnType<typeof useForm<FilterFormValues>>
  applyFilters: (values: FilterFormValues) => void
  resetFilters: () => void
  toggleStatusFilter: (status: string) => void
}

const DeliveriesContext = createContext<DeliveriesContextType | undefined>(undefined)

export function DeliveriesProvider({ children }: { children: ReactNode }) {
  // Table states
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [filters, setFilters] = useState<DeliveryFiltersType>({
    status: ['pending', 'completed'],
  })

  const form = useForm<FilterFormValues>({
    defaultValues: {
      recipient: '',
      sender: '',
      statusFilters: {
        pending: true,
        completed: true,
        cancelled: false,
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

    const newFilters: DeliveryFiltersType = {}

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
      cancelled: false,
      error: false,
    }

    form.reset({
      recipient: '',
      sender: '',
      statusFilters: defaultStatusFilters,
      dateRange: undefined,
    })
    setFilters({
      status: ['pending', 'completed'],
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
