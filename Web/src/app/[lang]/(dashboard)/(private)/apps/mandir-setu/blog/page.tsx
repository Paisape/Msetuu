import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import BlogListAdminClient from './BlogListAdminClient'

const BlogAdminPage = async () => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  return <BlogListAdminClient />
}

export default BlogAdminPage
