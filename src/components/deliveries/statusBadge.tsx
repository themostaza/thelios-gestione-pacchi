import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

// Status badge component - now using icons with hover labels
function StatusBadge({ status, active = true }: { status: string; active?: boolean }) {
  const getStyles = () => {
    if (!active) return 'bg-transparent border border-gray-300 text-gray-500'

    switch (status) {
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'error':
        return 'bg-black hover:bg-gray-800 text-white'
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
      case 'error':
        return 'Error'
      default:
        return status
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4' />
      case 'completed':
        return <CheckCircle className='h-4 w-4' />
      case 'cancelled':
        return <XCircle className='h-4 w-4' />
      case 'error':
        return <AlertTriangle className='h-4 w-4' />
      default:
        return null
    }
  }

  return (
    <Badge
      className={`${getStyles()} w-8 h-8 rounded-full p-1 flex items-center justify-center`}
      title={getLabel()}
    >
      {getIcon()}
    </Badge>
  )
}

export default StatusBadge
