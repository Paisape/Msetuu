import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { expireStaleVideos } from '@/libs/videoUpload'

// GET /api/my-orders — the logged-in customer's own orders across every module, for their
// "My Orders" page. No telemetry (ip/userAgent) is included here — that's admin-only, see
// /api/orders/trail which applies the same rule per status entry.
export async function GET() {
  try {
    const user = await requireUser()
    const id = user.id

    await expireStaleVideos()

    const [chadhava, epuja, jyotish, kundli, ecommerce, yatra] = await Promise.all([
      prisma.chadhavaOrder.findMany({ where: { userId: id }, include: { chadhavaListing: true }, orderBy: { createdAt: 'desc' } }),
      prisma.pujaOrder.findMany({ where: { userId: id }, include: { pujaListing: true, pujaPackage: true }, orderBy: { createdAt: 'desc' } }),
      prisma.consultationBooking.findMany({ where: { userId: id }, include: { astrologer: true }, orderBy: { createdAt: 'desc' } }),
      prisma.kundliOrder.findMany({ where: { userId: id }, include: { kundliListing: true }, orderBy: { createdAt: 'desc' } }),
      prisma.productOrder.findMany({ where: { userId: id }, include: { product: true }, orderBy: { createdAt: 'desc' } }),
      prisma.yatraBooking.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } })
    ])

    const orders = [
      ...chadhava.map(o => ({ type: 'CHADHAVA', id: o.id, label: o.chadhavaListing.title, amount: o.amountPaid, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt, videoUrl: o.videoUrl, videoUploadedAt: o.videoUploadedAt, videoExpired: o.videoExpired, targetId: o.chadhavaListingId as string | null })),
      ...epuja.map(o => ({ type: 'EPUJA', id: o.id, label: `${o.pujaListing.title} (${o.pujaPackage.type})`, amount: o.amountPaid, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt, videoUrl: o.videoUrl, videoUploadedAt: o.videoUploadedAt, videoExpired: o.videoExpired, targetId: o.pujaListingId as string | null })),
      ...jyotish.map(o => ({ type: 'JYOTISH', id: o.id, label: `${o.category} consultation`, amount: null, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt, targetId: o.astrologerId as string | null })),
      ...kundli.map(o => ({ type: 'KUNDLI', id: o.id, label: o.kundliType, amount: o.amountPaid, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt, targetId: o.kundliListingId as string | null })),
      ...ecommerce.map(o => ({ type: 'ECOMMERCE', id: o.id, label: o.product.name, amount: o.totalAmount, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt, targetId: o.productId as string | null })),
      ...yatra.map(o => ({ type: 'YATRA', id: o.id, label: o.yatraDestination, amount: null, status: o.status, paymentStatus: null, createdAt: o.createdAt, targetId: null as string | null }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}
