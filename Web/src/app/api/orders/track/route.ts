import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// The full name is never sent: the customer must type the main devotee's first name to get the video.
const maskName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map(part => part[0] + '*'.repeat(Math.max(part.length - 1, 2)))
    .join(' ')

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawId = searchParams.get('id')

    if (!rawId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })
    }

    const rawTrimmed = rawId.trim()
    let cleanId = rawTrimmed.replace(/^[#\s]*(MS\s*[-_]?|ORD\s*[-_]?)/i, '').trim()
    cleanId = cleanId.replace(/[\.\s]+.*$/, '').trim()
    cleanId = cleanId.replace(/[^a-zA-Z0-9-]/g, '')

    const searchIds = Array.from(new Set([rawTrimmed, cleanId, cleanId.toLowerCase(), cleanId.toUpperCase()].filter(Boolean)))
    const whereConditions = searchIds.flatMap(sId => [
      { id: { equals: sId, mode: 'insensitive' as const } },
      { id: { startsWith: sId, mode: 'insensitive' as const } }
    ])

    // 1. Check OfferLinkOrder (New Campaigns /o/[slug])
    const offerLinkOrder = await prisma.offerLinkOrder.findFirst({
      where: {
        OR: whereConditions
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
        name: maskName(primaryDevotee),
        status: (offerLinkOrder as any).videoUrl || (offerLinkOrder as any).videoExpired ? 'COMPLETED' : offerLinkOrder.paymentStatus === 'SUCCESS' ? 'CONFIRMED' : offerLinkOrder.paymentStatus,
        hasVideo: !!(offerLinkOrder as any).videoUrl,
        videoDeleted: !!(offerLinkOrder as any).videoExpired && !(offerLinkOrder as any).videoUrl,
        videoUploadedAt: (offerLinkOrder as any).videoUploadedAt,
        createdAt: offerLinkOrder.createdAt
      })
    }

    // 2. Check OfferOrder
    const offerOrder = await prisma.offerOrder.findFirst({
      where: {
        OR: whereConditions
      },
      include: { offer: { select: { title: true } } }
    })
    if (offerOrder) {
      return NextResponse.json({
        id: offerOrder.id,
        shortId: `#MS-${offerOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'Campaign Booking',
        title: offerOrder.offer?.title || 'Offer Link Puja',
        name: maskName(offerOrder.name),
        status: offerOrder.status,
        hasVideo: !!offerOrder.videoUrl,
        videoDeleted: !!(offerOrder as any).videoExpired && !offerOrder.videoUrl,
        videoUploadedAt: offerOrder.videoUploadedAt,
        createdAt: offerOrder.createdAt
      })
    }

    // 3. Check ChadhavaOrder
    const chadhavaOrder = await prisma.chadhavaOrder.findFirst({
      where: {
        OR: whereConditions
      },
      include: { chadhavaListing: { select: { title: true } } }
    })
    if (chadhavaOrder) {
      return NextResponse.json({
        id: chadhavaOrder.id,
        shortId: `#MS-${chadhavaOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'Chadhava',
        title: chadhavaOrder.chadhavaListing?.title || 'Chadhava offering',
        name: maskName(chadhavaOrder.name || 'Devotee'),
        status: chadhavaOrder.status,
        hasVideo: !!chadhavaOrder.videoUrl,
        videoDeleted: !!chadhavaOrder.videoExpired && !chadhavaOrder.videoUrl,
        videoUploadedAt: chadhavaOrder.videoUploadedAt,
        createdAt: chadhavaOrder.createdAt
      })
    }

    // 4. Check PujaOrder
    const pujaOrder = await prisma.pujaOrder.findFirst({
      where: {
        OR: whereConditions
      },
      include: { pujaListing: { select: { title: true } } }
    })
    if (pujaOrder) {
      return NextResponse.json({
        id: pujaOrder.id,
        shortId: `#MS-${pujaOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'E-Puja',
        title: pujaOrder.pujaListing?.title || 'E-Puja booking',
        name: maskName(pujaOrder.name || 'Devotee'),
        status: pujaOrder.status,
        hasVideo: !!pujaOrder.videoUrl,
        videoDeleted: !!pujaOrder.videoExpired && !pujaOrder.videoUrl,
        videoUploadedAt: pujaOrder.videoUploadedAt,
        createdAt: pujaOrder.createdAt
      })
    }

    // 5. Check ProductOrder
    const productOrder = await prisma.productOrder.findFirst({
      where: {
        OR: whereConditions
      },
      include: { product: { select: { name: true } }, user: { select: { name: true } } }
    })
    if (productOrder) {
      return NextResponse.json({
        id: productOrder.id,
        shortId: `#MS-${productOrder.id.slice(0, 8).toUpperCase()}`,
        type: 'E-Commerce',
        title: productOrder.product?.name || 'Store Item',
        name: maskName(productOrder.user?.name || 'Customer'),
        status: productOrder.status,
        createdAt: productOrder.createdAt
      })
    }

    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to track order.' }, { status: 500 })
  }
}
