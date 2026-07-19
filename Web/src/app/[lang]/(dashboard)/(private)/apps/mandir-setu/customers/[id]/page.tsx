import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import CustomerDetailClient from './CustomerDetailClient'

type Params = { params: Promise<{ id: string }> }

const CustomerDetailPage = async ({ params }: Params) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const { id } = await params

  return <CustomerDetailClient id={id} />
}

export default CustomerDetailPage
