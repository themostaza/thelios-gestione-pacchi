'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { X, Search, CalendarIcon, Clock, CheckCircle, XCircle, Eye, EyeOff, Filter } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDeliveries } from '@/context/deliveriesContext'

// Add this interface at the top of the file
interface DeliveryFilterPanelProps {
  isAdmin: boolean;
}

// Status badge component for filter selection
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
      default:
        return status
    }
  }

  return (
    <Badge
      className={`${getStyles()} px-2 py-1 flex items-center justify-center`}
    >
      {getLabel()}
    </Badge>
  )
}

export default function DeliveryFilterPanel({ isAdmin }: DeliveryFilterPanelProps) {
  const { form, applyFilters, resetFilters, toggleStatusFilter } = useDeliveries()
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  // Handle apply filters and close modal
  const handleApplyFilters = (values: any) => {
    applyFilters(values)
    setShowFilterDialog(false)
  }

  const FilterPanelContent = () => (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Filters</h3>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleApplyFilters)}
          className='space-y-4'
        >
          {/* Single column layout */}
          <div className='space-y-4'>
            <FormField
              control={form.control}
              name='dateRange'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Date Range</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={`w-full justify-start text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}
                              </>
                            ) : (
                              format(field.value.from, 'LLL dd, y')
                            )
                          ) : (
                            <span>Select date range</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-auto p-0'
                      align='start'
                    >
                      <Calendar
                        initialFocus
                        mode='range'
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
                      className='bg-white'
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isAdmin && (
              <FormField
                control={form.control}
                name='sender'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Filter by sender'
                        {...field}
                        className='bg-white'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className='flex gap-2 justify-end'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                resetFilters();
                setShowFilterDialog(false);
              }}
            >
              <X className='mr-2 h-4 w-4' />
              Reset
            </Button>
            <Button type='submit'>
              <Search className='mr-2 h-4 w-4' />
              Apply Filters
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setShowFilterDialog(true)}
      >
        <Filter className='h-4 w-4 mr-2' />
        Advanced Filters
      </Button>

      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delivery Filters</DialogTitle>
          </DialogHeader>
          <FilterPanelContent />
        </DialogContent>
      </Dialog>
    </>
  )
}
