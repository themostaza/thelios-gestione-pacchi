'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { getDeliveryById } from '@/app/actions/deliveryActions'
import { DeliveryData } from '@/app/actions/deliveryActions'

// Shadcn UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// Status badge component - similar to the one in deliveries page
function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white'
      case 'completed':
        return 'bg-green-500 text-white'
      case 'cancelled':
        return 'bg-red-500 text-white'
      case 'error':
        return 'bg-black text-white'
      default:
        return 'bg-gray-500 text-white'
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
        return <Clock className="h-4 w-4 mr-2" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-2" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 mr-2" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 mr-2" />
      default:
        return null
    }
  }

  return (
    <Badge className={`${getStyles()} px-3 py-1 flex items-center`}>
      {getIcon()}
      {getLabel()}
    </Badge>
  )
}

export default function DeliveryDetailPage() {
  const params = useParams()
  const id = params.id as string
  
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        setLoading(true)
        const response = await getDeliveryById(id)
        
        if (response.success && response.data) {
          setDelivery(response.data)
        } else {
          setError(response.message || 'Failed to load delivery details')
        }
      } catch (err) {
        setError('An error occurred while fetching delivery details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDelivery()
  }, [id])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/deliveries">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deliveries
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!delivery) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Delivery Not Found</CardTitle>
          <CardDescription>
            The requested delivery could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/deliveries">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deliveries
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Format dates for display
  const createdAt = format(new Date(delivery.created_at), 'PPP p')

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className='text-2xl font-bold'>Delivery #{delivery.id}</CardTitle>
            <CardDescription className='mt-2'>
              Created on {createdAt}
            </CardDescription>
          </div>
          <StatusBadge status={delivery.status} />
        </div>
        <Separator className='mt-4' />
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <Button variant="outline" asChild className="mb-6">
          <a href="/deliveries">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deliveries
          </a>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Recipient</h3>
              <p className="mt-1 text-lg">{delivery.recipientEmail}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Sender</h3>
              <p className="mt-1 text-lg">{delivery.user.email || 'Unknown'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <StatusBadge status={delivery.status} />
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1">{createdAt}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}