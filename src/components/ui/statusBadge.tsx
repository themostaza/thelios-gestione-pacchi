'use client'

import { ReactNode } from 'react'
import { useTranslation } from '@/i18n/I18nProvider'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusType = 
  // Delivery statuses
  | 'pending' 
  | 'completed' 
  | 'cancelled'
  // User statuses
  | 'registered'
  | 'not-registered'
  | 'admin'
  | 'not-admin'
  // Generic statuses
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

type StatusVariant = 'filled' | 'outline'

export interface StatusBadgeProps {
  status: StatusType
  variant?: StatusVariant
  label?: string
  icon?: ReactNode
  className?: string
}

export function StatusBadge({
  status,
  variant = 'filled',
  label,
  icon,
  className,
}: StatusBadgeProps) {
  const { t } = useTranslation()
  
  // Get the appropriate label if not provided
  const badgeLabel = label || getDefaultLabel(status, t)
  
  // Get appropriate style class based on status and variant
  const styleClass = getStatusStyle(status, variant)
  
  return (
    <Badge 
      variant='outline' 
      className={cn(styleClass, className)}
    >
      {badgeLabel}
      {icon && <span className="ml-1.5">{icon}</span>}
    </Badge>
  )
}

// Helper function to get default label text
function getDefaultLabel(status: StatusType, t: (key: string) => string): string {
  switch (status) {
    case 'pending': return t('deliveries.status.pending')
    case 'completed': return t('deliveries.status.completed')
    case 'cancelled': return t('deliveries.status.cancelled')
    case 'registered': return t('user.status.registered')
    case 'not-registered': return t('user.status.notRegistered')
    case 'admin': return t('user.status.admin')
    case 'not-admin': return t('user.status.notAdmin')
    case 'success': return t('common.success')
    case 'warning': return t('common.warning')
    case 'error': return t('common.error')
    case 'info': return t('common.info')
    default: return status
  }
}

// Helper function to get style classes
function getStatusStyle(status: StatusType, variant: StatusVariant): string {
  if (variant === 'outline') {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 hover:bg-yellow-100 text-yellow-800 font-medium'
      case 'completed':
        return 'bg-green-100 hover:bg-green-100 text-green-800 font-medium'
      case 'cancelled':
        return 'bg-red-100 hover:bg-red-100 text-red-800 font-medium'
      case 'registered':
        return 'bg-white hover:bg-white text-gray-800 border border-gray-200 font-medium'
      case 'not-registered':
        return 'bg-yellow-100 hover:bg-yellow-100 text-yellow-800 font-medium'
      case 'admin':
        return 'bg-black hover:bg-black text-white font-medium'
      case 'not-admin':
        return 'bg-white hover:bg-white text-gray-800 border border-gray-200 font-medium'
      case 'success':
        return 'bg-green-100 hover:bg-green-100 text-green-800 font-medium'
      case 'warning':
        return 'bg-yellow-100 hover:bg-yellow-100 text-yellow-800 font-medium'
      case 'error':
        return 'bg-red-100 hover:bg-red-100 text-red-800 font-medium'
      case 'info':
        return 'bg-blue-100 hover:bg-blue-100 text-blue-800 font-medium'
      default:
        return 'bg-gray-100 hover:bg-gray-100 text-gray-800 font-medium'
    }
  } else {
    // Filled variant
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white font-medium'
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 text-white font-medium'
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600 text-white font-medium'
      case 'registered':
        return 'bg-gray-500 hover:bg-gray-600 text-white font-medium'
      case 'not-registered':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white font-medium'
      case 'admin':
        return 'bg-black hover:bg-black text-white font-medium'
      case 'not-admin':
        return 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium'
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white font-medium'
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white font-medium'
      case 'error':
        return 'bg-red-500 hover:bg-red-600 text-white font-medium'
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 text-white font-medium'
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white font-medium'
    }
  }
} 