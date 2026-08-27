import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })
    }

    // 1. Check OfferOrder
    const offerOrder = await prisma.offerOrder.findUnique({
      where: { id },
      include: { offer: { select: { title: true } } }
    })
    if (offerOrder) {
      return NextResponse.json({
        id: offerOrder.id,
        type: 'Campaign Booking',
        title: offerOrder.offer?.title || 'Offer Link Puja',
        name: offerOrder.name,
        status: offerOrder.status,
        videoUrl: offerOrder.videoUrl,
        videoUploadedAt: offerOrder.videoUploadedAt,
        createdAt: offerOrder.createdAt
      })
    }

    // 2. Check ChadhavaOrder
    const chadhavaOrder = await prisma.chadhavaOrder.findUnique({
      where: { id },
      include: { chadhavaListing: { select: { title: true } } }
    })
    if (chadhavaOrder) {
      return NextResponse.json({
        id: chadhavaOrder.id,
        type: 'Chadhava',
        title: chadhavaOrder.chadhavaListing?.title || 'Chadhava offering',
        name: chadhavaOrder.name || 'Devotee',
        status: chadhavaOrder.status,
        videoUrl: chadhavaOrder.videoUrl,
        videoUploadedAt: chadhavaOrder.videoUploadedAt,
        createdAt: chadhavaOrder.createdAt
      })
    }

    // 3. Check PujaOrder
    const pujaOrder = await prisma.pujaOrder.findUnique({
      where: { id },
      include: { pujaListing: { select: { title: true } } }
    })
    if (pujaOrder) {
      return NextResponse.json({
        id: pujaOrder.id,
        type: 'E-Puja',
        title: pujaOrder.pujaListing?.title || 'E-Puja booking',
        name: pujaOrder.name || 'Devotee',
        status: pujaOrder.status,
        videoUrl: pujaOrder.videoUrl,
        videoUploadedAt: pujaOrder.videoUploadedAt,
        createdAt: pujaOrder.createdAt
      })
    }

    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to track order.' }, { status: 500 })
  }
}
