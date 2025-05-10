'use client'

import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { StatusBadge, StatusType } from '@/components/ui/statusBadge'
import { useDeliveries } from '@/context/deliveriesContext'

interface FilterStatusBadgeProps {
  status: StatusType
  active?: boolean
  eyeVisible?: boolean
}

function FilterStatusBadge({ status, active = true, eyeVisible = true }: FilterStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      variant={active ? 'filled' : 'outline'}
      className={!active ? 'bg-transparent border border-gray-300 text-gray-500' : ''}
      icon={eyeVisible ? active ? <Eye className='h-3.5 w-3.5' /> : <EyeOff className='h-3.5 w-3.5' /> : undefined}
    />
  )
}

export default function DeliveryStatusFilter() {
  const { form, toggleStatusFilter, applyFilters } = useDeliveries()

  const handleStatusToggle = (status: string) => {
    toggleStatusFilter(status)

    applyFilters(form.getValues())
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name='statusFilters'
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className='flex flex-col lg:flex-row items-baseline justify-center gap-2 border rounded-md'>
                {' '}
                <Button
                  onClick={() => handleStatusToggle('pending')}
                  variant='ghost'
                  size='sm'
                  className='flex items-center justify-between w-full lg:w-auto'
                >
                  <FilterStatusBadge
                    status='pending'
                    active={field.value.pending}
                    eyeVisible={false}
                  />
                  {field.value.pending ? <Eye className='ml-2 h-3.5 w-3.5' /> : <EyeOff className='ml-2 h-3.5 w-3.5' />}
                </Button>
                <Button
                  onClick={() => handleStatusToggle('completed')}
                  variant='ghost'
                  size='sm'
                  className='flex items-center justify-between w-full lg:w-auto'
                >
                  <FilterStatusBadge
                    status='completed'
                    active={field.value.completed}
                    eyeVisible={false}
                  />
                  {field.value.completed ? <Eye className='ml-2 h-3.5 w-3.5' /> : <EyeOff className='ml-2 h-3.5 w-3.5' />}
                </Button>
                <Button
                  onClick={() => handleStatusToggle('cancelled')}
                  variant='ghost'
                  size='sm'
                  className='flex items-center justify-between w-full lg:w-auto'
                >
                  <FilterStatusBadge
                    status='cancelled'
                    active={field.value.cancelled}
                    eyeVisible={false}
                  />
                  {field.value.cancelled ? <Eye className='ml-2 h-3.5 w-3.5' /> : <EyeOff className='ml-2 h-3.5 w-3.5' />}
                </Button>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  )
}
