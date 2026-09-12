import { NextResponse } from 'next/server'
 
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  let cleanId = (rawId || '').trim()
  cleanId = cleanId.replace(/^[#\s]*(MS\s*[-_]?|ORD\s*[-_]?)/i, '').trim()
  cleanId = cleanId.replace(/[\.\s]+.*$/, '').trim()
  cleanId = cleanId.replace(/[^a-zA-Z0-9-]/g, '')

  const origin = new URL(req.url).origin
  let appUrl = 'https://www.mandirsetuu.com'
  if (origin.includes('localhost')) {
    appUrl = origin
  } else if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    let configured = process.env.NEXT_PUBLIC_APP_URL.trim()
    if (configured.includes('mandirsetuu.com') && !configured.includes('www.mandirsetuu.com')) {
      configured = configured.replace('mandirsetuu.com', 'www.mandirsetuu.com')
    }
    appUrl = configured
  }
  
  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}`, 307)
}
