'use client'

import { formatDistanceToNow } from 'date-fns'
import { format } from 'date-fns'
import { DateRange } from "react-day-picker"
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

// Shadcn UI components
import { Calendar } from '@/components/ui/calendar'
import { 
  CalendarIcon, X, FilterIcon, ArrowUpDown, ArrowUp, ArrowDown, 
  SlidersHorizontal, CheckCircle, Clock, XCircle, AlertTriangle 
} from 'lucide-react'
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

// Status badge component - now using icons with hover labels
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
  
  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Badge 
      className={`${getStyles()} w-8 h-8 rounded-full p-1 flex items-center justify-center`} 
      title={getLabel()}
    >
      {getIcon()}
    </Badge>
  )
}

// Loading row component - adjust column widths
function LoadingRow() {
  return (
    <TableRow>
      <TableCell className='w-[15%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[30%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[30%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[10%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
      <TableCell className='w-[15%]'>
        <Skeleton className='h-6 w-full' />
      </TableCell>
    </TableRow>
  )
}

// Type for the filter form values
type FilterFormValues = {
  recipient: string
  sender: string
  statusFilters: Record<string, boolean>
  dateRange: DateRange | undefined
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

  // Initialize with default filters to exclude error status and cancelled
  const [filters, setFilters] = useState<DeliveryFilters>({
    status: ['pending', 'completed'],
  })

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc',
  })

  // Status filters - initialize with pending and completed active
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    pending: true,
    completed: true,
    cancelled: false,
    error: false,
  })

  // Form setup with updated default values
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

    // Add sender email filter
    if (values.sender.trim()) {
      newFilters.userEmail = values.sender
    }

    // Always pass an array for status, even for a single selection
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

  // Reset filters - should reset to default (all except error, in_progress, and cancelled)
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
    setStatusFilters(defaultStatusFilters)
    setFilters({
      status: ['pending', 'completed'],
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
        return {
          field,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { field, direction: 'asc' }
    })
  }

  // Get sorted deliveries
  const getSortedDeliveries = () => {
    if (!sortConfig.field) return deliveries

    return [...deliveries].sort((a, b) => {
      if (sortConfig.field === 'user') {
        // Gestione speciale per il campo annidato user.email
        const emailA = a.user?.email?.toLowerCase() || '';
        const emailB = b.user?.email?.toLowerCase() || '';
        return sortConfig.direction === 'asc' 
          ? emailA.localeCompare(emailB) 
          : emailB.localeCompare(emailA);
      }

      // Gestione normale per altri campi
      const fieldA = a[sortConfig.field as keyof typeof a];
      const fieldB = b[sortConfig.field as keyof typeof b];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortConfig.direction === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      // Add null checking for the comparison
      return sortConfig.direction === 'asc'
        ? ((fieldA ?? '') > (fieldB ?? '') ? 1 : -1)
        : ((fieldA ?? '') < (fieldB ?? '') ? 1 : -1);
    });
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

  // Se c'è una colonna che mostra l'email dell'utente, aggiorna così
  const filterDeliveries = (items: DeliveryData[]) => {
    const senderFilter = form.watch('sender');
    
    return items.filter(delivery => {
      // Altri filtri...
      
      // Filtro per email utente
      if (senderFilter && !delivery.user.email.toLowerCase().includes(senderFilter.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  return (
    <Card className='w-full flex flex-col'>
      <CardHeader>
        <div className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-2xl font-bold'>Your Deliveries</CardTitle>
            <CardDescription className='mt-2'>Manage and monitor all your delivery requests</CardDescription>
          </div>
          <div className='flex space-x-2'>
            <Button
              variant='default'
              size='sm'
              asChild
            >
              <Link href="/delivery/new">New</Link>
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className='h-4 w-4 mr-2' />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>
        <Separator className='mt-4' />
      </CardHeader>

      <CardContent className='flex-1 overflow-hidden'>
        <div className='flex flex-col md:flex-row gap-4 h-full'>
          {/* Table area in a ScrollArea - now comes first */}
          <div className={`${showFilters ? 'md:w-3/4' : 'w-full'} flex flex-col h-full overflow-hidden`}>
            {error ? (
              <div className='text-center py-4 text-red-500'>{error}</div>
            ) : initialLoading ? (
              <ScrollArea className='h-full'>
                <div className='rounded-md'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[15%]'>ID</TableHead>
                        <TableHead className='w-[30%]'>Recipient</TableHead>
                        <TableHead className='w-[30%]'>Sender</TableHead>
                        <TableHead className='w-[10%]'>Status</TableHead>
                        <TableHead className='w-[15%]'>Created</TableHead>
                        <TableHead className='w-[10%]'>Actions</TableHead>
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
              <ScrollArea className='h-full flex-1 overflow-auto'>
                <div className='rounded-md'>
                  <Table>
                    <TableCaption>{Object.keys(filters).length > 0 ? 'Filtered results' : 'List of your recent deliveries'}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className='w-[15%] cursor-pointer'
                          onClick={() => handleSort('id')}
                        >
                          <div className='flex items-center'>
                            ID
                            {renderSortIndicator('id')}
                          </div>
                        </TableHead>
                        <TableHead
                          className='w-[30%] cursor-pointer'
                          onClick={() => handleSort('recipientEmail')}
                        >
                          <div className='flex items-center'>
                            Recipient
                            {renderSortIndicator('recipientEmail')}
                          </div>
                        </TableHead>
                        <TableHead
                          className='w-[30%] cursor-pointer'
                          onClick={() => handleSort('user')}
                        >
                          <div className='flex items-center'>
                            Sender
                            {renderSortIndicator('user')}
                          </div>
                        </TableHead>
                        <TableHead
                          className='w-[10%] cursor-pointer'
                          onClick={() => handleSort('status')}
                        >
                          <div className='flex items-center'>
                            Status
                            {renderSortIndicator('status')}
                          </div>
                        </TableHead>
                        <TableHead
                          className='w-[15%] cursor-pointer'
                          onClick={() => handleSort('created_at')}
                        >
                          <div className='flex items-center'>
                            Created
                            {renderSortIndicator('created_at')}
                          </div>
                        </TableHead>
                        <TableHead className='w-[10%]'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDeliveries.map((delivery) => (
                        <TableRow
                          key={delivery.id}
                          id={`delivery-row-${delivery.id}`}
                        >
                          <TableCell className='w-[15%] font-medium'>{delivery.id}</TableCell>
                          <TableCell className='w-[30%]'>{delivery.recipientEmail}</TableCell>
                          <TableCell className='w-[30%]'>{delivery.user.email || 'Unknown sender'}</TableCell>
                          <TableCell className='w-[10%]'>
                            <StatusBadge status={delivery.status} />
                          </TableCell>
                          <TableCell className='w-[15%]'>
                            {formatDistanceToNow(new Date(delivery.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className='w-[10%]'>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                            >
                              <Link href={`/delivery/${delivery.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Load More button now inside ScrollArea */}
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
                </div>
              </ScrollArea>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                {Object.keys(filters).length > 0 ? 'No results found with the applied filters' : "You haven't created any deliveries yet. Create your first delivery from the dashboard."}
              </div>
            )}
          </div>
          
          {/* Filter sidebar - now on the right */}
          {showFilters && (
            <div className='md:w-1/4 mb-4 md:mb-0 border-l pl-4'>
              <Form {...form}>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Filter Deliveries</h3>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={resetFilters}
                  >
                    <X className='mr-2 h-4 w-4' />
                    Reset
                  </Button>
                </div>
                <form
                  onSubmit={form.handleSubmit(applyFilters)}
                  className='space-y-4'
                >
                  {/* Recipient filter */}
                  <FormField
                    control={form.control}
                    name='recipient'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Filter by recipient email'
                            {...field}
                            autoComplete='off'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Sender filter */}
                  <FormField
                    control={form.control}
                    name='sender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Filter by sender email'
                            {...field}
                            autoComplete='off'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Status filter - moved after sender */}
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

                  {/* DatePickerWithRange */}
                  <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date Range</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.from ? (
                                  field.value.to ? (
                                    <>
                                      {format(field.value.from, "LLL dd, y")} -{" "}
                                      {format(field.value.to, "LLL dd, y")}
                                    </>
                                  ) : (
                                    format(field.value.from, "LLL dd, y")
                                  )
                                ) : (
                                  <span>Select date range</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={field.value?.from}
                              selected={field.value}
                              onSelect={field.onChange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  
                  {/* Filter action buttons - in flex-row layout */}
                  <div className='flex flex-row gap-2 mt-4'>
                    <Button
                      type='submit'
                      disabled={Object.values(form.watch('statusFilters')).every((value) => !value)}
                      className='w-full'
                    >
                      <FilterIcon className='mr-2 h-4 w-4' />
                      Apply
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
