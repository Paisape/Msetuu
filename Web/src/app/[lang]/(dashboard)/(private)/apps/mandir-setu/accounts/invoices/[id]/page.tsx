import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import InvoicePreviewClient from './InvoicePreviewClient'

type Params = { params: Promise<{ id: string }> }

const InvoicePreviewPage = async ({ params }: Params) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const { id } = await params

  return <InvoicePreviewClient id={id} />
}

export default InvoicePreviewPage
