import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const cleanId = rawId.replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()

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

  // 1. Try OfferLinkOrder (New Campaigns)
  const offerLinkOrder = await prisma.offerLinkOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    },
    select: { id: true, videoUrl: true }
  })
  if (offerLinkOrder) {
    return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${offerLinkOrder.id}`)
  }

  // 2. Try OfferOrder
  const offerOrder = await prisma.offerOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    },
    select: { id: true, videoUrl: true }
  })
  if (offerOrder) {
    return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${offerOrder.id}`)
  }

  // 3. Try ChadhavaOrder
  const chadhavaOrder = await prisma.chadhavaOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    },
    select: { id: true, videoUrl: true }
  })
  if (chadhavaOrder) {
    return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${chadhavaOrder.id}`)
  }

  // 4. Try PujaOrder
  const pujaOrder = await prisma.pujaOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    },
    select: { id: true, videoUrl: true }
  })
  if (pujaOrder) {
    return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${pujaOrder.id}`)
  }

  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}&error=no_video`)
}
