import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams, search } = new URL(req.url)
  const idParam = searchParams.get('id') || searchParams.get('orderId') || searchParams.get('q')

  let targetId = idParam

  // If URL was /t/?EABAE823 or /t?EABAE823
  if (!targetId && search && search.length > 1) {
    targetId = search.slice(1).replace(/^[=&\s]+/, '').split('&')[0]
  }

  const cleanId = (targetId || '').replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

  if (cleanId) {
    return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}`, 307)
  }

  return NextResponse.redirect(`${appUrl}/front-pages/track-order`, 307)
}
