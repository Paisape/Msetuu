import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams, search } = new URL(req.url)
  const idParam = searchParams.get('id') || searchParams.get('orderId') || searchParams.get('q')

  let targetId = idParam

  // If URL was /t/?09F4E89B or /t?09F4E89B
  if (!targetId && search && search.length > 1) {
    targetId = search.slice(1).replace(/^[=&\s]+/, '').split('&')[0]
  }

  let cleanId = (targetId || '').trim()

  // 1. Remove prefix #, MS-, ORD-
  cleanId = cleanId.replace(/^[#\s]*(MS\s*[-_]?|ORD\s*[-_]?)/i, '').trim()

  // 2. Strip trailing dot or SMS trailing text like .Team, .Team Mandirsetuu
  cleanId = cleanId.replace(/[\.\s]+.*$/, '').trim()

  // 3. Keep only alphanumeric / uuid characters
  cleanId = cleanId.replace(/[^a-zA-Z0-9-]/g, '')

  const origin = new URL(req.url).origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (origin.includes('localhost') ? origin : 'https://www.mandirsetuu.com')

  if (cleanId) {
    return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}`, 307)
  }

  return NextResponse.redirect(`${appUrl}/front-pages/track-order`, 307)
}
