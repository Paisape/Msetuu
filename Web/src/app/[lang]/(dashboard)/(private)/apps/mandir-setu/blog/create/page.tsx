import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import BlogEditorClient from '../BlogEditorClient'

const CreateBlogPostPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <BlogEditorClient mode='create' />
}

export default CreateBlogPostPage
