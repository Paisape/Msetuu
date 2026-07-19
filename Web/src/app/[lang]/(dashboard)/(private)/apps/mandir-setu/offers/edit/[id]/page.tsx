import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OfferEditorClient from '../../OfferEditorClient'

const EditOfferPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const { id: slugParam } = await params

  return <OfferEditorClient mode='edit' slugParam={slugParam} />
}

export default EditOfferPage
