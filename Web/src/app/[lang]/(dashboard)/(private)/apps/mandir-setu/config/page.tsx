import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import ConfigClient from './ConfigClient'

const ConfigPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <ConfigClient />
}

export default ConfigPage
