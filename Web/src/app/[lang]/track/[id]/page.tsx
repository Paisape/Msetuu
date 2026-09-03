import { redirect } from 'next/navigation'

export default async function ShortTrackIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cleanId = (id || '').replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()
  redirect(`/front-pages/track-order?id=${cleanId}`)
}
