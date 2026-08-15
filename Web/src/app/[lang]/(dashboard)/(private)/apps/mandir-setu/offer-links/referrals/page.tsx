import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import ReferralsClient from './ReferralsClient'

const ReferralsPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <ReferralsClient />
}

export default ReferralsPage
