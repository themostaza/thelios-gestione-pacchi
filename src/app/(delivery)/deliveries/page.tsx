'use client'

import { formatDistanceToNow } from 'date-fns'
import { format } from 'date-fns'

// Shadcn UI components
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X, FilterIcon, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { getDeliveriesPaginated, DeliveryFilters, DeliveryData } from '@/app/actions/deliveryActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Status badge component
function StatusBadge({ status, active = true }: { status: string; active?: boolean }) {
  const getStyles = () => {
    if (!active) return 'bg-transparent border border-gray-300 text-gray-500'

    switch (status) {
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'error':
        return 'bg-black hover:bg-gray-800 text-white'
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white'
    }
  }

  const getLabel = () => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'error':
        return 'Error'
      default:
        return status
    }
  }

  return <Badge className={getStyles()}>{getLabel()}</Badge>
}

// Loading row component - with consistent column widths matching table headers
function LoadingRow() {
  return (
    <TableRow>
      <TableCell className='w-[10%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[50%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[15%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[25%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
    </TableRow>
  )
}

// Type for the filter form values
type FilterFormValues = {
  recipient: string
  statusFilters: Record<string, boolean>
  creationDate: Date | undefined
}

// Sort configuration type
type SortConfig = {
  field: keyof DeliveryData | null
  direction: 'asc' | 'desc'
}

export default function DeliveriesPage() {
  // State for deliveries and pagination
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize with default filters to exclude error status and remove in_progress
  const [filters, setFilters] = useState<DeliveryFilters>({
    status: ['pending', 'completed', 'cancelled'],
  })

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc',
  })

  // Status filters - initialize with all except error and in_progress active
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    pending: true,
    completed: true,
    cancelled: true,
    error: false,
  })

  // Form setup with updated default values
  const form = useForm<FilterFormValues>({
    defaultValues: {
      recipient: '',
      statusFilters: {
        pending: true,
        completed: true,
        cancelled: true,
        error: false,
      },
      creationDate: undefined,
    },
  })

  // State to control filter visibility
  const [showFilters, setShowFilters] = useState(false)

  // Load deliveries when page changes
  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true)

        const response = await getDeliveriesPaginated(page, 10, filters)

        if (response.success && response.data) {
          if (page === 1) {
            setDeliveries(response.data)
          } else {
            // Prevent duplicate entries by checking IDs
            setDeliveries((prev) => {
              const existingIds = new Set(prev.map((d) => d.id))
              const newItems = response.data!.filter((d) => !existingIds.has(d.id))
              return [...prev, ...newItems]
            })
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

  // Update the filter submission handler
  const applyFilters = (values: FilterFormValues) => {
    // Get selected statuses
    const selectedStatuses = Object.entries(values.statusFilters)
      .filter(([_, isSelected]) => isSelected)
      .map(([status]) => status)

    // Create new filters object
    const newFilters: DeliveryFilters = {}

    if (values.recipient.trim()) {
      newFilters.recipientEmail = values.recipient
    }

    // Always pass an array for status, even for a single selection
    if (selectedStatuses.length > 0) {
      newFilters.status = selectedStatuses
    }

    if (values.creationDate) {
      // Set date range for the entire day
      const startOfDay = new Date(values.creationDate)
      startOfDay.setHours(0, 0, 0, 0)
      newFilters.startDate = startOfDay.toISOString()

      const endOfDay = new Date(values.creationDate)
      endOfDay.setHours(23, 59, 59, 999)
      newFilters.endDate = endOfDay.toISOString()
    }

    setFilters(newFilters)
    setPage(1)
  }

  // Reset filters - should reset to default (all except error and in_progress)
  const resetFilters = () => {
    const defaultStatusFilters = {
      pending: true,
      completed: true,
      cancelled: true,
      error: false,
    }

    form.reset({
      recipient: '',
      statusFilters: defaultStatusFilters,
      creationDate: undefined,
    })
    setStatusFilters(defaultStatusFilters)
    setFilters({
      status: ['pending', 'completed', 'cancelled'],
    })
    setPage(1)
  }

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    const updatedFilters = {
      ...form.getValues().statusFilters,
      [status]: !form.getValues().statusFilters[status],
    }

    form.setValue('statusFilters', updatedFilters)
    setStatusFilters(updatedFilters)
  }

  // Handle column sorting
  const handleSort = (field: keyof DeliveryData) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.field === field) {
        // Toggle direction if same field
        return {
          field,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      // New field, default to ascending
      return { field, direction: 'asc' }
    })
  }

  // Get sorted deliveries
  const getSortedDeliveries = () => {
    if (!sortConfig.field) return deliveries

    return [...deliveries].sort((a, b) => {
      const fieldA = a[sortConfig.field as keyof DeliveryData]
      const fieldB = b[sortConfig.field as keyof DeliveryData]

      // Handle null/undefined values
      if (fieldA === null && fieldB === null) return 0
      if (fieldA === null) return sortConfig.direction === 'asc' ? -1 : 1
      if (fieldB === null) return sortConfig.direction === 'asc' ? 1 : -1

      // Handle dates separately
      if (sortConfig.field === 'created_at') {
        const dateA = new Date(fieldA as string).getTime()
        const dateB = new Date(fieldB as string).getTime()
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
      }

      // Handle standard sorting
      if ((fieldA < fieldB && sortConfig.direction === 'asc') || (fieldA > fieldB && sortConfig.direction === 'desc')) {
        return -1
      }
      return 1
    })
  }

  // Get sorted and filtered data
  const sortedDeliveries = getSortedDeliveries()

  // Render sort indicator based on current sort status
  const renderSortIndicator = (field: keyof DeliveryData) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className='ml-2 h-4 w-4' />
    }
    return sortConfig.direction === 'asc' ? <ArrowUp className='ml-2 h-4 w-4' /> : <ArrowDown className='ml-2 h-4 w-4' />
  }

  return (
    <Card className='w-full flex flex-col'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Your Deliveries</CardTitle>
          <CardDescription>Manage and monitor all your delivery requests</CardDescription>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowFilters(!showFilters)}
          className='ml-auto'
        >
          <SlidersHorizontal className='h-4 w-4 mr-2' />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </CardHeader>

      <CardContent className='flex-1 overflow-hidden'>
        <div className='flex flex-col md:flex-row gap-4 h-full'>
          {/* Filter sidebar */}
          {showFilters && (
            <div className='md:w-1/4 mb-4 md:mb-0 border-r pr-4'>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(applyFilters)}
                  className='space-y-4'
                >
                  {/* Status filter - now horizontal */}
                  <FormField
                    control={form.control}
                    name='statusFilters'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <div className='flex flex-row flex-wrap gap-2'>
                            <div
                              className='cursor-pointer'
                              onClick={() => toggleStatusFilter('pending')}
                            >
                              <StatusBadge
                                status='pending'
                                active={field.value.pending}
                              />
                            </div>
                            <div
                              className='cursor-pointer'
                              onClick={() => toggleStatusFilter('completed')}
                            >
                              <StatusBadge
                                status='completed'
                                active={field.value.completed}
                              />
                            </div>
                            <div
                              className='cursor-pointer'
                              onClick={() => toggleStatusFilter('cancelled')}
                            >
                              <StatusBadge
                                status='cancelled'
                                active={field.value.cancelled}
                              />
                            </div>
                            <div
                              className='cursor-pointer'
                              onClick={() => toggleStatusFilter('error')}
                            >
                              <StatusBadge
                                status='error'
                                active={field.value.error}
                              />
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Recipient filter */}
                  <FormField
                    control={form.control}
                    name='recipient'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Filter by recipient'
                            {...field}
                            autoComplete='off'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Creation Date */}
                  <FormField
                    control={form.control}
                    name='creationDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creation Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={`w-full justify-start text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                              >
                                <CalendarIcon className='mr-2 h-4 w-4' />
                                {field.value ? format(field.value, 'PPP') : 'Select date'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className='w-auto p-0'
                            align='start'
                          >
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />

                  {/* Filter action buttons */}
                  <div className='flex flex-col gap-2'>
                    <Button
                      type='submit'
                      disabled={Object.values(form.watch('statusFilters')).every((value) => !value)}
                    >
                      <FilterIcon className='mr-2 h-4 w-4' />
                      Apply Filters
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={resetFilters}
                    >
                      <X className='mr-2 h-4 w-4' />
                      Reset
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Table area in a ScrollArea */}
          <div className={`${showFilters ? 'md:w-3/4' : 'w-full'} flex flex-col h-full overflow-hidden`}>
            {error ? (
              <div className='text-center py-4 text-red-500'>{error}</div>
            ) : initialLoading ? (
              <ScrollArea className='h-full'>
                <div className='rounded-md'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[10%]'>ID</TableHead>
                        <TableHead className='w-[50%]'>Recipient</TableHead>
                        <TableHead className='w-[15%]'>Status</TableHead>
                        <TableHead className='w-[25%]'>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <LoadingRow key={i} />
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            ) : deliveries.length > 0 ? (
              <>
                <ScrollArea className='h-full flex-1 overflow-auto'>
                  <div className='rounded-md'>
                    <Table>
                      <TableCaption>{Object.keys(filters).length > 0 ? 'Filtered results' : 'List of your recent deliveries'}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className='w-[10%] cursor-pointer'
                            onClick={() => handleSort('id')}
                          >
                            <div className='flex items-center'>
                              ID
                              {renderSortIndicator('id')}
                            </div>
                          </TableHead>
                          <TableHead
                            className='w-[50%] cursor-pointer'
                            onClick={() => handleSort('recipientEmail')}
                          >
                            <div className='flex items-center'>
                              Recipient
                              {renderSortIndicator('recipientEmail')}
                            </div>
                          </TableHead>
                          <TableHead
                            className='w-[15%] cursor-pointer'
                            onClick={() => handleSort('status')}
                          >
                            <div className='flex items-center'>
                              Status
                              {renderSortIndicator('status')}
                            </div>
                          </TableHead>
                          <TableHead
                            className='w-[25%] cursor-pointer'
                            onClick={() => handleSort('created_at')}
                          >
                            <div className='flex items-center'>
                              Created
                              {renderSortIndicator('created_at')}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedDeliveries.map((delivery) => (
                          <TableRow
                            key={delivery.id}
                            id={`delivery-row-${delivery.id}`}
                          >
                            <TableCell className='w-[10%] font-medium'>{delivery.id}</TableCell>
                            <TableCell className='w-[50%]'>{delivery.recipientEmail}</TableCell>
                            <TableCell className='w-[15%]'>
                              <StatusBadge status={delivery.status} />
                            </TableCell>
                            <TableCell className='w-[25%]'>
                              {formatDistanceToNow(new Date(delivery.created_at), {
                                addSuffix: true,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>

                {hasMore && (
                  <div className='py-4 flex justify-center'>
                    <Button
                      variant='outline'
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}

                {!hasMore && <div className='text-center text-sm text-muted-foreground my-4'>You've reached the end of the list</div>}
              </>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                {Object.keys(filters).length > 0 ? 'No results found with the applied filters' : "You haven't created any deliveries yet. Create your first delivery from the dashboard."}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
