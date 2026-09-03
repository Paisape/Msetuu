import { redirect } from 'next/navigation'

export default async function ShortTrackingQueryPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string; orderId?: string; q?: string }>
}) {
  const query = await searchParams
  const id = query.id || query.orderId || query.q || ''
  const cleanId = id.replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()

  if (cleanId) {
    redirect(`/front-pages/track-order?id=${cleanId}`)
  }

  redirect('/front-pages/track-order')
}
