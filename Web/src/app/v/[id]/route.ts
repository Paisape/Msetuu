import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const cleanId = rawId.replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()

  // 1. Try OfferLinkOrder (New Campaigns)
  const offerLinkOrder = await prisma.offerLinkOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    }
  })
  if (offerLinkOrder) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
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
    select: { videoUrl: true }
  })
  if (offerOrder?.videoUrl) {
    return NextResponse.redirect(offerOrder.videoUrl)
  }

  // 3. Try ChadhavaOrder
  const chadhavaOrder = await prisma.chadhavaOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    },
    select: { videoUrl: true }
  })
  if (chadhavaOrder?.videoUrl) {
    return NextResponse.redirect(chadhavaOrder.videoUrl)
  }

  // 4. Try PujaOrder
  const pujaOrder = await prisma.pujaOrder.findFirst({
    where: {
      OR: [
        { id: { equals: cleanId, mode: 'insensitive' } },
        { id: { startsWith: cleanId, mode: 'insensitive' } }
      ]
    },
    select: { videoUrl: true }
  })
  if (pujaOrder?.videoUrl) {
    return NextResponse.redirect(pujaOrder.videoUrl)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${cleanId}&error=no_video`)
}
