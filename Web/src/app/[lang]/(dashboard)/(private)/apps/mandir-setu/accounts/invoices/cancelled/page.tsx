import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import InvoiceTable from '@/components/admin/InvoiceTable'

const CancelledInvoicesPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <InvoiceTable title='Cancelled Invoices' status='CANCELLED' />
}

export default CancelledInvoicesPage
