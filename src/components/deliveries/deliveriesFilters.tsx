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

  const FilterPanelContent = () => (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>{t('common.filters')}</h3>

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
                  <FormLabel>{t('deliveries.dateRange')}</FormLabel>
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
                            <span>{t('deliveries.selectDateRange')}</span>
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
