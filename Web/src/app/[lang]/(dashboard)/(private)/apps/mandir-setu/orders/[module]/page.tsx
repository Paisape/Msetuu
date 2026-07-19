import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OrdersModuleClient from './OrdersModuleClient'

type Params = { params: Promise<{ module: string }> }

const OrdersModulePage = async ({ params }: Params) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const { module } = await params

  return <OrdersModuleClient module={module} />
}

export default OrdersModulePage
