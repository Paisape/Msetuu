import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import OfferLinksClient from './OfferLinksClient'

const OfferLinksPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <OfferLinksClient />
}

export default OfferLinksPage
