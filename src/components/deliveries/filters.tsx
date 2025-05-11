'use client'

import { format } from 'date-fns'
import { X, Search, CalendarIcon, Filter } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDeliveries } from '@/context/deliveriesContext'
import { useTranslation } from '@/i18n/I18nProvider'

interface DeliveryFilterPanelProps {
  isAdmin: boolean
}

export default function DeliveryFilterPanel({ isAdmin }: DeliveryFilterPanelProps) {
  const { t } = useTranslation()
  const { form, applyFilters, resetFilters } = useDeliveries()
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApplyFilters = (values: any) => {
    applyFilters(values)
    setShowFilterDialog(false)
  }

  const FilterPanelContent = () => {
    // Local state to manage calendar selection
    const [calendarOpen, setCalendarOpen] = useState(false)
    // Ensure we always have a defined value (null instead of undefined)
    const [localDateRange, setLocalDateRange] = useState(form.getValues('dateRange') || null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDateRangeSelect = (range: any) => {
      // Always set a defined value (null if range is undefined)
      setLocalDateRange(range || null)
      // Only update form value when range is complete
      if (range?.from && range?.to) {
        // Because we're storing as string in the hidden input
        form.setValue('dateRange', range)
        setCalendarOpen(false)
      }
    }

    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-medium'>{t('common.filters')}</h3>

        {/* Date Range Picker outside the form */}
        <div className='mb-4'>
          <label className='text-sm font-medium'>{t('deliveries.dateRange')}</label>
          <Popover
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={`w-full justify-start text-left font-normal ${!localDateRange && 'text-muted-foreground'}`}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {localDateRange?.from ? (
                  localDateRange.to ? (
                    <>
                      {format(localDateRange.from, 'LLL dd, y')} - {format(localDateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(localDateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>{t('deliveries.selectDateRange')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-auto p-0'
              align='start'
            >
              <Calendar
                initialFocus
                mode='range'
                defaultMonth={localDateRange?.from}
                selected={localDateRange || undefined}
                onSelect={handleDateRangeSelect}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleApplyFilters)}
            className='space-y-4'
          >
            {/* Hidden field for date range */}
            <FormField
              control={form.control}
              name='dateRange'
              render={({ field }) => (
                <FormItem className='hidden'>
                  <FormControl>
                    <Input
                      type='hidden'
                      {...field}
                      // Ensure the value is always a string (to avoid controlled/uncontrolled switching)
                      value={field.value ? JSON.stringify(field.value) : ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='recipient'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deliveries.recipient')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`${t('common.filters')} ${t('deliveries.recipient').toLowerCase()}`}
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
                      <FormLabel>{t('deliveries.sender')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`${t('common.filters')} ${t('deliveries.sender').toLowerCase()}`}
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
                  resetFilters()
                  setLocalDateRange(null)
                  setShowFilterDialog(false)
                }}
              >
                <X className='mr-2 h-4 w-4' />
                {t('common.cancel')}
              </Button>
              <Button type='submit'>
                <Search className='mr-2 h-4 w-4' />
                {t('common.filters')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setShowFilterDialog(true)}
        className='w-full lg:w-auto'
      >
        <Filter className='h-4 w-4 mr-2' />
        {t('common.filters')}
      </Button>

      <Dialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('deliveries.title')} {t('common.filters')}
            </DialogTitle>
          </DialogHeader>
          <FilterPanelContent />
        </DialogContent>
      </Dialog>
    </>
  )
}
