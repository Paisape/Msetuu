import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import VideoUploadClient from './VideoUploadClient'

const VideoUploadPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <VideoUploadClient />
}

export default VideoUploadPage
