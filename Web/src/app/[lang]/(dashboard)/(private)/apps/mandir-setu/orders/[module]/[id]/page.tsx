import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OrderDetailClient from './OrderDetailClient'

type Params = { params: Promise<{ module: string; id: string }> }

const OrderDetailPage = async ({ params }: Params) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const { module, id } = await params

  return <OrderDetailClient module={module} id={id} />
}

export default OrderDetailPage
