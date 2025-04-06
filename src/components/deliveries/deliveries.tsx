'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import DeliveryFilterPanel from '@/components/deliveries/deliveriesFilters'
import DeliveriesTable from '@/components/deliveries/deliveriesTable'
import DeliveryStatusFilter from '@/components/deliveries/deliveryStatusFilter'
import GenericCardView from '@/components/GenericCardView'
import { DeliveriesProvider, useDeliveries } from '@/context/deliveriesContext'
import { useTranslation } from '@/i18n/I18nProvider'

interface DeliveriesProps {
  isAdmin: boolean
}

function DeliveriesContent({ isAdmin }: DeliveriesProps) {
  const { loading, error } = useDeliveries()
  const { t } = useTranslation()
  const headerRight = (
    <div className='w-full flex flex-col lg:flex-row gap-2 lg:justify-end items-start lg:items-center'>
      <DeliveryStatusFilter />
      <DeliveryFilterPanel isAdmin={isAdmin} />
    </div>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className='flex flex-col items-center justify-center gap-2 h-full py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p>Loading deliveries...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className='flex justify-center flex-col items-center py-12'>
          <p className='text-red-500'>Error: {error}</p>
        </div>
      )
    }

    return (
      <div className='h-full'>
        <DeliveriesTable />
      </div>
    )
  }

  return (
    <GenericCardView
      title={t('deliveries.title')}
      description={t('deliveries.description')}
      headerRight={headerRight}
      useScrollArea={true}
      className='w-full flex flex-col h-full'
      contentClassName='flex-1 overflow-hidden'
      footerClassName='p-6'
    >
      {renderContent()}
    </GenericCardView>
  )
}

export default function Deliveries({ isAdmin }: DeliveriesProps) {
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
      <DeliveriesContent isAdmin={isAdmin} />
    </DeliveriesProvider>
  )
}
