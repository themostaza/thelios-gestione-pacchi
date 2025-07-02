'use client'

import { useEffect, useState } from 'react'

import DeliveriesFilters from '@/components/deliveries/filters'
import DeliveriesTable from '@/components/deliveries/list'
import DeliveryStatusFilter from '@/components/deliveries/statusFilter'
import GenericCardView from '@/components/genericCardView'
import { DeliveriesProvider, useDeliveries } from '@/context/deliveriesContext'
import { useTranslation } from '@/i18n/I18nProvider'

import DeliveryColumnPicker from './columnPicker'

function DeliveriesContent() {
  const { error } = useDeliveries()
  const { t } = useTranslation()
  const headerRight = (
    <div className='w-full flex flex-col lg:flex-row gap-2 justify-stretch lg:justify-end items-stretch lg:items-center'>
      <DeliveryStatusFilter />
      <DeliveriesFilters />
      <DeliveryColumnPicker />
    </div>
  )

  const renderContent = () => {
    if (error) {
      return (
        <div className='flex justify-center flex-col items-center py-12'>
          <p className='text-red-500'>Error: {error}</p>
        </div>
      )
    }

    // Always render DeliveriesTable, which will handle its own loading state
    return (
      <div className='h-full flex-1 overflow-auto'>
        <DeliveriesTable />
      </div>
    )
  }

  return (
    <GenericCardView
      title={t('deliveries.title')}
      description={t('deliveries.description')}
      headerRight={headerRight}
      useScrollArea={false}
      className='w-full flex flex-col h-full'
      contentClassName='flex-1 overflow-hidden flex flex-col'
      footerClassName='p-6'
    >
      {renderContent()}
    </GenericCardView>
  )
}

export default function Deliveries() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only render once client-side
  if (!isMounted) {
    return null // or a loading skeleton
  }

  return (
    <DeliveriesProvider>
      <DeliveriesContent />
    </DeliveriesProvider>
  )
}
