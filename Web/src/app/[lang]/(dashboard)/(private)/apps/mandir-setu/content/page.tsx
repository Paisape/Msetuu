import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ lang: string }>
}

const ContentManagementPage = async (props: Props) => {
  const params = await props.params
  const { lang } = params
  
  // Just redirect to the first tab in the new sidebar menu structure
  redirect(`/${lang}/apps/mandir-setu/content/banners`)
}

export default ContentManagementPage
