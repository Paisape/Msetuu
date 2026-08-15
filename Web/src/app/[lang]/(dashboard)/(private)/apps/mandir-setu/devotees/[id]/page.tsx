import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import DevoteeDetailClient from './DevoteeDetailClient'

const DevoteeDetailPage = async () => {
  const denied = await requireAdminOrDenied()
  if (denied) return denied
  return <DevoteeDetailClient />
}

export default DevoteeDetailPage
