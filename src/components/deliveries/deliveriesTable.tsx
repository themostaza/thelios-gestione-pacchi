'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { DeliveryData } from '@/app/actions/deliveryActions'
import StatusBadge from '@/components/deliveries/statusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDeliveries } from '@/context/deliveriesContext'
import { cn } from '@/lib/utils'

// Column width constants for consistency
const COLUMN_WIDTHS = {
  id: 'w-[15%]',
  recipient: 'w-[25%]',
  sender: 'w-[25%]',
  status: 'w-[15%]',
  created: 'w-[20%]',
  actions: 'w-[10%]',
}

// Loading row component using the same column widths as the data table
function LoadingRow() {
  return (
    <TableRow>
      <TableCell className={COLUMN_WIDTHS.id}>
        <Skeleton className='h-8 w-full' />
      </TableCell>
      <TableCell className={COLUMN_WIDTHS.recipient}>
        <Skeleton className='h-8 w-full' />
      </TableCell>
      <TableCell className={COLUMN_WIDTHS.sender}>
        <Skeleton className='h-8 w-full' />
      </TableCell>
      <TableCell className={COLUMN_WIDTHS.status}>
        <Skeleton className='h-8 w-full' />
      </TableCell>
      <TableCell className={COLUMN_WIDTHS.created}>
        <Skeleton className='h-8 w-full' />
      </TableCell>
      <TableCell className={COLUMN_WIDTHS.actions}>
        <Skeleton className='h-8 w-full' />
      </TableCell>
    </TableRow>
  )
}

// Sort configuration type
type SortConfig = {
  field: keyof DeliveryData | null
  direction: 'asc' | 'desc'
}

type DeliveriesTableProps = {
  showFilters: boolean
}

function DeliveriesTable({ showFilters }: DeliveriesTableProps) {
  const { deliveries, error, initialLoading, loading, hasMore, setPage } = useDeliveries()

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc',
  })

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
        const emailA = a.user?.email?.toLowerCase() || ''
        const emailB = b.user?.email?.toLowerCase() || ''
        return sortConfig.direction === 'asc' ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA)
      }

      // Gestione normale per altri campi
      const fieldA = a[sortConfig.field as keyof typeof a]
      const fieldB = b[sortConfig.field as keyof typeof b]

      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortConfig.direction === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      }

      // Add null checking for the comparison
      return sortConfig.direction === 'asc' ? ((fieldA ?? '') > (fieldB ?? '') ? 1 : -1) : (fieldA ?? '') < (fieldB ?? '') ? 1 : -1
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

  const renderTableContent = () => {
    if (error) {
      return <div className='text-center py-4 text-red-500'>{error}</div>
    }

    if (deliveries.length === 0 && !initialLoading) {
      return <p className='text-center py-8 text-gray-500'>No results found with the applied filters</p>
    }

    return (
      <div className='flex-1'>
        <Table className='table-fixed w-full'>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={COLUMN_WIDTHS.id}
                  onClick={!initialLoading ? () => handleSort('id') : undefined}
                  style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                >
                  <div className='flex items-center whitespace-nowrap'>
                    ID
                    {!initialLoading ? renderSortIndicator('id') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                  </div>
                </TableHead>
                <TableHead
                  className={COLUMN_WIDTHS.recipient}
                  onClick={!initialLoading ? () => handleSort('recipientEmail') : undefined}
                  style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                >
                  <div className='flex items-center whitespace-nowrap'>
                    Recipient
                    {!initialLoading ? renderSortIndicator('recipientEmail') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                  </div>
                </TableHead>
                <TableHead
                  className={COLUMN_WIDTHS.sender}
                  onClick={!initialLoading ? () => handleSort('user') : undefined}
                  style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                >
                  <div className='flex items-center whitespace-nowrap'>
                    Sender
                    {!initialLoading ? renderSortIndicator('user') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                  </div>
                </TableHead>
                <TableHead
                  className={COLUMN_WIDTHS.status}
                  onClick={!initialLoading ? () => handleSort('status') : undefined}
                  style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                >
                  <div className='flex items-center whitespace-nowrap'>
                    Status
                    {!initialLoading ? renderSortIndicator('status') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                  </div>
                </TableHead>
                <TableHead
                  className={COLUMN_WIDTHS.created}
                  onClick={!initialLoading ? () => handleSort('created_at') : undefined}
                  style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                >
                  <div className='flex items-center whitespace-nowrap'>
                    Created
                    {!initialLoading ? renderSortIndicator('created_at') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                  </div>
                </TableHead>
                <TableHead className={COLUMN_WIDTHS.actions}>
                  <div className='whitespace-nowrap'>Actions</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => <LoadingRow key={i} />)
                : sortedDeliveries.map((delivery) => (
                    <TableRow
                      key={delivery.id}
                      id={`delivery-row-${delivery.id}`}
                    >
                      <TableCell className={COLUMN_WIDTHS.id + ' font-medium'}>{delivery.id}</TableCell>
                      <TableCell className={COLUMN_WIDTHS.recipient + ' truncate'}>{delivery.recipientEmail}</TableCell>
                      <TableCell className={COLUMN_WIDTHS.sender + ' truncate'}>{delivery.user.email || 'Unknown sender'}</TableCell>
                      <TableCell className={cn(COLUMN_WIDTHS.status, 'flex justify-left items-center w-full h-full')}>
                        <StatusBadge status={delivery.status} />
                      </TableCell>
                      <TableCell className={COLUMN_WIDTHS.created}>
                        {formatDistanceToNow(new Date(delivery.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className={COLUMN_WIDTHS.actions}>
                        <Button
                          variant='outline'
                          size='sm'
                          asChild
                        >
                          <Link href={`/delivery/${delivery.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!initialLoading && hasMore && (
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

          {!initialLoading && !hasMore && deliveries.length > 0 && <div className='text-center text-xs italic text-muted-foreground my-4'>You&apos;ve reached the end of the list</div>}

      </div>
    )
  }

  // Main component return
  return renderTableContent()
}

export default DeliveriesTable
