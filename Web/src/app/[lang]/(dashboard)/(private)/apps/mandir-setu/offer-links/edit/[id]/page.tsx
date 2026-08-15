import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OfferLinkEditorClient from '../../OfferLinkEditorClient'

type Params = {
  params: Promise<{ id: string }>
}

const EditOfferLinkPage = async ({ params }: Params) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const { id } = await params

  return <OfferLinkEditorClient editId={id} />
}

export default EditOfferLinkPage
