import { StatusBadge as BaseStatusBadge, StatusType } from '@/components/ui/statusBadge'

interface DeliveryStatusBadgeProps {
  status: StatusType
}

export default function StatusBadge({ status }: DeliveryStatusBadgeProps) {
  return (
    <BaseStatusBadge
      status={status}
      variant='filled'
    />
  )
}
