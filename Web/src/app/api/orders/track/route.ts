import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawId = searchParams.get('id')

    if (!rawId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })
    }

    const cleanId = rawId.replace(/^[#\s]*(MS-|ms-|ORD-|ord-)?/i, '').trim()

    // 1. Check OfferLinkOrder (New Campaigns /o/[slug])
    const offerLinkOrder = await prisma.offerLinkOrder.findFirst({
      where: {
        OR: [
          { id: { equals: cleanId, mode: 'insensitive' } },
          { id: { startsWith: cleanId, mode: 'insensitive' } }
        ]
      },
      include: {
        offerLink: { select: { title: true } },
        devotees: { where: { isPrimary: true }, take: 1, select: { name: true } }
      }
    })
    if (offerLinkOrder) {
      const primaryDevotee = offerLinkOrder.devotees[0]?.name || 'Devotee'
      return NextResponse.json({
        id: offerLinkOrder.id,
        shortId: `#MS-${offerLinkOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'Offer Campaign Booking',
        title: offerLinkOrder.offerLink?.title || 'Campaign Offering',
        name: primaryDevotee,
        status: offerLinkOrder.paymentStatus === 'SUCCESS' ? 'CONFIRMED' : offerLinkOrder.paymentStatus,
        createdAt: offerLinkOrder.createdAt
      })
    }

    // 2. Check OfferOrder
    const offerOrder = await prisma.offerOrder.findFirst({
      where: {
        OR: [
          { id: { equals: cleanId, mode: 'insensitive' } },
          { id: { startsWith: cleanId, mode: 'insensitive' } }
        ]
      },
      include: { offer: { select: { title: true } } }
    })
    if (offerOrder) {
      return NextResponse.json({
        id: offerOrder.id,
        shortId: `#MS-${offerOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'Campaign Booking',
        title: offerOrder.offer?.title || 'Offer Link Puja',
        name: offerOrder.name,
        status: offerOrder.status,
        videoUrl: offerOrder.videoUrl,
        videoUploadedAt: offerOrder.videoUploadedAt,
        createdAt: offerOrder.createdAt
      })
    }

    // 3. Check ChadhavaOrder
    const chadhavaOrder = await prisma.chadhavaOrder.findFirst({
      where: {
        OR: [
          { id: { equals: cleanId, mode: 'insensitive' } },
          { id: { startsWith: cleanId, mode: 'insensitive' } }
        ]
      },
      include: { chadhavaListing: { select: { title: true } } }
    })
    if (chadhavaOrder) {
      return NextResponse.json({
        id: chadhavaOrder.id,
        shortId: `#MS-${chadhavaOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'Chadhava',
        title: chadhavaOrder.chadhavaListing?.title || 'Chadhava offering',
        name: chadhavaOrder.name || 'Devotee',
        status: chadhavaOrder.status,
        videoUrl: chadhavaOrder.videoUrl,
        videoUploadedAt: chadhavaOrder.videoUploadedAt,
        createdAt: chadhavaOrder.createdAt
      })
    }

    // 4. Check PujaOrder
    const pujaOrder = await prisma.pujaOrder.findFirst({
      where: {
        OR: [
          { id: { equals: cleanId, mode: 'insensitive' } },
          { id: { startsWith: cleanId, mode: 'insensitive' } }
        ]
      },
      include: { pujaListing: { select: { title: true } } }
    })
    if (pujaOrder) {
      return NextResponse.json({
        id: pujaOrder.id,
        shortId: `#MS-${pujaOrder.id.slice(0, 8).toUpperCase()}`,
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
