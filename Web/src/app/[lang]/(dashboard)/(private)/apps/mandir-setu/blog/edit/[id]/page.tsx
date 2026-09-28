import { requireAdminOrDenied } from '@/components/admin/AdminGuard'
import BlogEditorClient from '../../BlogEditorClient'

type Props = {
  params: Promise<{ id: string }>
}

const EditBlogPostPage = async (props: Props) => {
  const denied = await requireAdminOrDenied()

  if (denied) return denied

  const params = await props.params

  return <BlogEditorClient mode='edit' postId={params.id} />
}

export default EditBlogPostPage
