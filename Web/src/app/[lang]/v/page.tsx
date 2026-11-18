import { redirect } from 'next/navigation'

export default async function ShortVideoPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  const cleanId = (id || '').replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()

  if (cleanId) {
    redirect(`/front-pages/track-order?id=${cleanId}`)
  }

  redirect('/front-pages/track-order')
}
