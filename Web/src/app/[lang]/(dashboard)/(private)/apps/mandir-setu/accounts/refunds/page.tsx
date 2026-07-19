import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import RefundsClient from './RefundsClient'

const RefundsPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <RefundsClient />
}

export default RefundsPage
