import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import InvoiceTable from '@/components/admin/InvoiceTable'

const InvoiceListPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <InvoiceTable title='Invoices' status='PAID' />
}

export default InvoiceListPage
