import DeliveryView from '@/components/delivery/DeliveryView'

export default async function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DeliveryView deliveryId={id} />
}
