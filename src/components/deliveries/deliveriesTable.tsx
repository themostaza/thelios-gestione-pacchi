'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useState } from 'react'
import { DeliveryData } from '@/app/actions/deliveryActions'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/deliveries/statusBadge'
import { useDeliveries } from '@/context/deliveriesContext'

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

// Sort configuration type
type SortConfig = {
  field: keyof DeliveryData | null
  direction: 'asc' | 'desc'
}

type DeliveriesTableProps = {
  showFilters: boolean
}

function DeliveriesTable({ showFilters }: DeliveriesTableProps) {
  const { 
    deliveries, 
    error, 
    initialLoading, 
    loading, 
    hasMore, 
    setPage 
  } = useDeliveries()

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

  if (error) {
    return <div className='text-center py-4 text-red-500'>{error}</div>;
  }

  if (initialLoading) {
    return (
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
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500'>
        {showFilters ? 'No results found with the applied filters' : "You haven't created any deliveries yet. Create your first delivery from the dashboard."}
      </div>
    );
  }

  return (
    <ScrollArea className='h-full flex-1 overflow-auto'>
      <div className='rounded-md'>
        <Table>
          <TableCaption>{showFilters ? 'Filtered results' : 'List of your recent deliveries'}</TableCaption>
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
  );
}

export default DeliveriesTable; 