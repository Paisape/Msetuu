import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const cleanId = rawId.replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}`, 307)
}
