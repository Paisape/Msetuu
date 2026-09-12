import { NextResponse } from 'next/server'
 
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  let cleanId = (rawId || '').trim()
  cleanId = cleanId.replace(/^[#\s]*(MS\s*[-_]?|ORD\s*[-_]?)/i, '').trim()
  cleanId = cleanId.replace(/[\.\s]+.*$/, '').trim()
  cleanId = cleanId.replace(/[^a-zA-Z0-9-]/g, '')

  const origin = new URL(req.url).origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (origin.includes('localhost') ? origin : 'https://www.mandirsetuu.com')
  
  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}`, 307)
}
