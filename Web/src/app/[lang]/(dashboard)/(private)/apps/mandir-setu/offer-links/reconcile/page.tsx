import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import ReconcileClient from './ReconcileClient'

const ReconcilePage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <ReconcileClient />
}

export default ReconcilePage
