import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import CustomersClient from './CustomersClient'

const CustomersPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <CustomersClient />
}

export default CustomersPage
