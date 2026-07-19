import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import DashboardClient from './DashboardClient'

// The order-management console previously lived here as a single tabbed page
// (MandirSetuAdminClient). It's been replaced by dedicated pages under Orders/Customers/
// Accounts in the sidebar — this route is now the Mandir Setu dashboard landing page.
const MandirSetuAdminPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <DashboardClient />
}

export default MandirSetuAdminPage
