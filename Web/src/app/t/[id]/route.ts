import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  
  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${id}`)
}
