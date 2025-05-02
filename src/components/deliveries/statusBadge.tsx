import { StatusBadge as BaseStatusBadge, StatusType } from '@/components/ui/statusBadge'
import { useTranslation } from '@/i18n/I18nProvider'

interface DeliveryStatusBadgeProps {
  status: StatusType
}

export default function StatusBadge({ status }: DeliveryStatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <BaseStatusBadge
      status={status}
      label={t(`deliveries.statusText.${status}`)}
      variant='filled'
    />
  )
}
