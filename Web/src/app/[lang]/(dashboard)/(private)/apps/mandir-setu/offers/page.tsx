import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OffersClient from './OffersClient'

const OffersPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <OffersClient />
}

export default OffersPage
