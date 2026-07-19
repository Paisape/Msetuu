import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OfferEditorClient from '../OfferEditorClient'

const CreateOfferPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <OfferEditorClient mode='create' />
}

export default CreateOfferPage
