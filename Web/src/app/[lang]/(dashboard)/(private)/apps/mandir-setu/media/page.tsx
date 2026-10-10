import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import MediaLibraryClient from './MediaLibraryClient'

const MediaLibraryPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <MediaLibraryClient />
}

export default MediaLibraryPage
