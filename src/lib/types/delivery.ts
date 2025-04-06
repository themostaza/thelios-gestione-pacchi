import { DateRange } from 'react-day-picker'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { StatusType } from '@/components/ui/statusBadge'
import { deliverySchema } from '@/lib/validations/delivery'

export type DeliveryFormData = z.infer<typeof deliverySchema>

export type DeliveryData = {
  id: number
  recipientEmail: string
  place: string
  notes: string
  status: StatusType
  created_at: string
  user: {
    email: string
  }
}

export type ValidationErrors = {
  [K in keyof DeliveryFormData]?: string[] | string
} & {
  form?: string[]
}

export type DeliveryActionState = {
  message: string
  errors: ValidationErrors
  success: boolean
  data: DeliveryData | null
}

export type ValidationResult = {
  valid: boolean
  errors: ValidationErrors
}

export type Recipient = {
  name: string
  surname: string
  email: string
}

export type SuccessResponse = {
  message: string
  errors: null
  success: true
  data: DeliveryData
}

export type ErrorResponse = {
  message: string
  errors: ValidationErrors
  success: false
  data: null
}

export type DeliveryFilters = {
  recipientEmail?: string
  place?: string
  status?: string | string[]
  startDate?: string
  endDate?: string
  searchTerm?: string
  userEmail?: string
}

export type PaginatedDeliveriesResponse = {
  success: boolean
  data: DeliveryData[] | null
  message: string
  hasMore: boolean
  count?: number | null
}

export type StatusUpdateResponse = {
  success: boolean
  message: string
  data: DeliveryData | null
}

export type ReminderLog = {
  id: string
  delivery_id: string
  ok: boolean
  message: string
  send_at: string | Date
}

export type FilterFormValues = {
  recipient: string
  sender: string
  statusFilters: Record<string, boolean>
  dateRange: DateRange | undefined
}

export type DeliveriesContextType = {
  deliveries: DeliveryData[]
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  hasMore: boolean
  loading: boolean
  initialLoading: boolean
  error: string | null
  filters: DeliveryFilters
  form: UseFormReturn<FilterFormValues>
  applyFilters: (values: FilterFormValues) => void
  resetFilters: () => void
  toggleStatusFilter: (status: string) => void
  columnVisibility: {
    id: boolean
    recipient: boolean
    sender: boolean
    status: boolean
    created: boolean
  }
  setColumnVisibility: (visibility: {
    id: boolean
    recipient: boolean
    sender: boolean
    status: boolean
    created: boolean
  }) => void
}

export type DeliveryContextType = {
  delivery: DeliveryData | null
  loading: boolean
  error: string | null
  emailLogs: ReminderLog[]
  changeStatus: (newStatus: StatusType) => Promise<void>
  sendReminder: () => Promise<void>
}

export type SortConfig = {
  field: keyof DeliveryData | null
  direction: 'asc' | 'desc'
}
