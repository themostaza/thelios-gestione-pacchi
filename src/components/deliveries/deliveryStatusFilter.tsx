'use client'

import { Eye, EyeOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { useDeliveries } from '@/context/deliveriesContext'

// Status badge component for filter selection
function StatusBadge({ status, active = true, eyeVisible = true }: { status: string; active?: boolean; eyeVisible?: boolean }) {
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
    <Badge className={`${getStyles()} px-2 py-1 flex items-center gap-1.5`}>
      {getLabel()}
      {eyeVisible && (active ? <Eye className='h-3.5 w-3.5' /> : <EyeOff className='h-3.5 w-3.5' />)}
    </Badge>
  )
}

export default function DeliveryStatusFilter() {
  const { form, toggleStatusFilter, applyFilters } = useDeliveries()

  const handleStatusToggle = (status: string) => {
    toggleStatusFilter(status)
    // Immediately apply filters after toggling
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
              <div className='flex flex-row items-baseline justify-center gap-2 border rounded-md p-2'>
                {' '}
                <Button
                  onClick={() => handleStatusToggle('pending')}
                  variant='ghost'
                  size='sm'
                >
                  <StatusBadge
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
                >
                  <StatusBadge
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
                >
                  <StatusBadge
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
