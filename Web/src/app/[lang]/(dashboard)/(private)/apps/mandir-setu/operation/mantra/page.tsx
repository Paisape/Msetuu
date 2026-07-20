import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import MantraManagementClient from './MantraManagementClient'

const MantraManagementPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <MantraManagementClient />
}

export default MantraManagementPage
