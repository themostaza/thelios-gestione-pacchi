import { Badge } from '@/components/ui/badge'

// Status badge component - now using icons with hover labels
function StatusBadge({ status }: { status: string }) {
  // Remove error status handling and keep only pending, completed, and cancelled
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500 hover:bg-green-600 w-full flex justify-center items-center">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500 hover:bg-red-600 w-full flex justify-center items-center">Cancelled</Badge>;
    default:
      // For any other status, show as pending
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 w-full flex justify-center items-center">Pending</Badge>;
  }
}

export default StatusBadge
