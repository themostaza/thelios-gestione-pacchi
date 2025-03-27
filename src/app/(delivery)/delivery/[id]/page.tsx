import DeliveryView from '@/components/delivery/DeliveryView'

export default function DeliveryPage({ params }: { params: { id: string } }) {
  return <DeliveryView id={params.id} />
}
