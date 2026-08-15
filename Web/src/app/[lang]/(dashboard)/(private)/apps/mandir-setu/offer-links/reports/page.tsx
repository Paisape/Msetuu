import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import ReportsClient from './ReportsClient'

const ReportsPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <ReportsClient />
}

export default ReportsPage
