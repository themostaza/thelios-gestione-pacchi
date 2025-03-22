'use client'

import { useDeliveries } from '@/context/deliveriesContext'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Search, CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from "react-day-picker"

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

export default function DeliveryFilterPanel() {
  const { 
    form, 
    applyFilters, 
    resetFilters,
    toggleStatusFilter 
  } = useDeliveries()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Filters</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(applyFilters)} className="space-y-4">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient</FormLabel>
                <FormControl>
                  <Input placeholder="Filter by recipient" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sender</FormLabel>
                <FormControl>
                  <Input placeholder="Filter by sender" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusFilters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <div className="flex flex-row flex-wrap gap-2">
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleStatusFilter('pending')}
                    >
                      <StatusBadge
                        status="pending"
                        active={field.value.pending}
                      />
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleStatusFilter('completed')}
                    >
                      <StatusBadge
                        status="completed"
                        active={field.value.completed}
                      />
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleStatusFilter('cancelled')}
                    >
                      <StatusBadge
                        status="cancelled"
                        active={field.value.cancelled}
                      />
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={() => toggleStatusFilter('error')}
                    >
                      <StatusBadge
                        status="error"
                        active={field.value.error}
                      />
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

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

          <div className="flex space-x-2 pt-4">
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 