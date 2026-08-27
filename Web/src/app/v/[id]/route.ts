import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Try OfferOrder
  const offerOrder = await prisma.offerOrder.findUnique({
    where: { id },
    select: { videoUrl: true }
  })
  if (offerOrder?.videoUrl) {
    return NextResponse.redirect(offerOrder.videoUrl)
  }

  // 2. Try ChadhavaOrder
  const chadhavaOrder = await prisma.chadhavaOrder.findUnique({
    where: { id },
    select: { videoUrl: true }
  })
  if (chadhavaOrder?.videoUrl) {
    return NextResponse.redirect(chadhavaOrder.videoUrl)
  }

  // 3. Try PujaOrder
  const pujaOrder = await prisma.pujaOrder.findUnique({
    where: { id },
    select: { videoUrl: true }
  })
  if (pujaOrder?.videoUrl) {
    return NextResponse.redirect(pujaOrder.videoUrl)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  return NextResponse.redirect(`${appUrl}/front-pages/track-order?id=${id}&error=no_video`)
}
