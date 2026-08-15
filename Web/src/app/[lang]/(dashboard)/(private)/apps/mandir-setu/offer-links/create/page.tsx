import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OfferLinkEditorClient from '../OfferLinkEditorClient'

const CreateOfferLinkPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <OfferLinkEditorClient />
}

export default CreateOfferLinkPage
