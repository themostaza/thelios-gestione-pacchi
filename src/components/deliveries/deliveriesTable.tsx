'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

import StatusBadge from '@/components/deliveries/statusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDeliveries } from '@/context/deliveriesContext'
import { useTranslation } from '@/i18n/I18nProvider'
import { DeliveryData } from '@/lib/types/delivery'
import { cn } from '@/lib/utils'

const COLUMN_WIDTHS = {
  id: 'w-[15%]',
  recipient: 'w-[25%]',
  sender: 'w-[25%]',
  status: 'w-[15%]',
  created: 'w-[20%]',
  actions: 'w-[10%]',
}

type SortConfig = {
  field: keyof DeliveryData | null
  direction: 'asc' | 'desc'
}

function DeliveriesTable() {
  const { deliveries, error, initialLoading, loading, hasMore, setPage, columnVisibility } = useDeliveries()
  const { t } = useTranslation()

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc',
  })

  const tableRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadNextPage = useCallback(() => {
    if (hasMore && !loading && !initialLoading) {
      console.log('Loading more items, page increment triggered')
      try {
        setPage((prevPage) => prevPage + 1)
      } catch (err) {
        console.error('Error incrementing page:', err)
      }
    }
  }, [hasMore, loading, initialLoading, setPage])

  useEffect(() => {
    if (initialLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          loadNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentLoaderRef = loaderRef.current
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef)
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef)
      }
    }
  }, [loadNextPage, initialLoading])

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

  const getSortedDeliveries = () => {
    if (!sortConfig.field) return deliveries

    return [...deliveries].sort((a, b) => {
      if (sortConfig.field === 'user') {
        const emailA = a.user?.email?.toLowerCase() || ''
        const emailB = b.user?.email?.toLowerCase() || ''
        return sortConfig.direction === 'asc' ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA)
      }

      const fieldA = a[sortConfig.field as keyof typeof a]
      const fieldB = b[sortConfig.field as keyof typeof b]

      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortConfig.direction === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      }

      return sortConfig.direction === 'asc' ? ((fieldA ?? '') > (fieldB ?? '') ? 1 : -1) : (fieldA ?? '') < (fieldB ?? '') ? 1 : -1
    })
  }

  const sortedDeliveries = getSortedDeliveries()

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
      return <p className='text-center py-8 text-gray-500'>{t('deliveries.noResultsFound')}</p>
    }

    const numberOfSkeletonRows = 5

    return (
      <div className='flex flex-col h-full'>
        <div
          className='overflow-auto flex-1 min-h-0'
          ref={tableRef}
        >
          <Table className='table-fixed w-full'>
            <TableHeader className='sticky top-0 bg-background z-10'>
              <TableRow>
                {columnVisibility.id && (
                  <TableHead
                    className={COLUMN_WIDTHS.id}
                    onClick={!initialLoading ? () => handleSort('id') : undefined}
                    style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                  >
                    <div className='flex items-center whitespace-nowrap'>
                      {t('deliveries.id')}
                      {!initialLoading ? renderSortIndicator('id') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.recipient && (
                  <TableHead
                    className={COLUMN_WIDTHS.recipient}
                    onClick={!initialLoading ? () => handleSort('recipientEmail') : undefined}
                    style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                  >
                    <div className='flex items-center whitespace-nowrap'>
                      {t('deliveries.recipient')}
                      {!initialLoading ? renderSortIndicator('recipientEmail') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.sender && (
                  <TableHead
                    className={COLUMN_WIDTHS.sender}
                    onClick={!initialLoading ? () => handleSort('user') : undefined}
                    style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                  >
                    <div className='flex items-center whitespace-nowrap'>
                      {t('deliveries.sender')}
                      {!initialLoading ? renderSortIndicator('user') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.status && (
                  <TableHead
                    className={COLUMN_WIDTHS.status}
                    onClick={!initialLoading ? () => handleSort('status') : undefined}
                    style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                  >
                    <div className='flex items-center whitespace-nowrap'>
                      {t('common.status')}
                      {!initialLoading ? renderSortIndicator('status') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.created && (
                  <TableHead
                    className={COLUMN_WIDTHS.created}
                    onClick={!initialLoading ? () => handleSort('created_at') : undefined}
                    style={{ cursor: !initialLoading ? 'pointer' : 'default' }}
                  >
                    <div className='flex items-center whitespace-nowrap'>
                      {t('deliveries.created')}
                      {!initialLoading ? renderSortIndicator('created_at') : <ArrowUpDown className='ml-2 h-4 w-4' />}
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDeliveries.map((delivery) => (
                <TableRow
                  key={delivery.id}
                  id={`delivery-row-${delivery.id}`}
                  onClick={() => (window.location.href = `/delivery/${delivery.id}`)}
                  className='cursor-pointer'
                >
                  {columnVisibility.id && <TableCell className={COLUMN_WIDTHS.id + ' font-medium'}>{delivery.id}</TableCell>}
                  {columnVisibility.recipient && <TableCell className={COLUMN_WIDTHS.recipient + ' truncate'}>{delivery.recipientEmail}</TableCell>}
                  {columnVisibility.sender && <TableCell className={COLUMN_WIDTHS.sender + ' truncate'}>{delivery.user.email || t('deliveries.unknownSender')}</TableCell>}
                  {columnVisibility.status && (
                    <TableCell className={cn(COLUMN_WIDTHS.status, 'flex justify-left items-center w-full h-full')}>
                      <StatusBadge status={delivery.status} />
                    </TableCell>
                  )}
                  {columnVisibility.created && (
                    <TableCell className={COLUMN_WIDTHS.created}>
                      {formatDistanceToNow(new Date(delivery.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {loading &&
                Array(numberOfSkeletonRows)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={`loading-${i}`}>
                      {columnVisibility.id && (
                        <TableCell className={COLUMN_WIDTHS.id}>
                          <Skeleton className='h-6 w-full' />
                        </TableCell>
                      )}
                      {columnVisibility.recipient && (
                        <TableCell className={COLUMN_WIDTHS.recipient}>
                          <Skeleton className='h-6 w-full' />
                        </TableCell>
                      )}
                      {columnVisibility.sender && (
                        <TableCell className={COLUMN_WIDTHS.sender}>
                          <Skeleton className='h-6 w-full' />
                        </TableCell>
                      )}
                      {columnVisibility.status && (
                        <TableCell className={COLUMN_WIDTHS.status}>
                          <Skeleton className='h-6 w-full' />
                        </TableCell>
                      )}
                      {columnVisibility.created && (
                        <TableCell className={COLUMN_WIDTHS.created}>
                          <Skeleton className='h-6 w-full' />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          <div
            ref={loaderRef}
            className='h-16 w-full'
          >
            {hasMore && <div className='text-center py-4 text-sm text-gray-500'>{loading ? 'Loading more...' : ''}</div>}

            {!initialLoading && !hasMore && deliveries.length > 0 && <div className='text-center text-xs italic text-muted-foreground my-4'>{t('deliveries.endOfList')}</div>}
          </div>
        </div>
      </div>
    )
  }

  return renderTableContent()
}
export default DeliveriesTable
