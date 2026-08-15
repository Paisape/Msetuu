import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import DevoteesClient from './DevoteesClient'

const DevoteesPage = async () => {
  const denied = await requireAdminOrDenied()
  if (denied) return denied
  return <DevoteesClient />
}

export default DevoteesPage
