import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/offer/orders — Admin only: lists all offer orders (standard offer orders + offer link promotion bookings)
export async function GET(req: Request) {
  try {
    await requireAdmin()

    const [standardOrders, linkOrders] = await Promise.all([
      prisma.offerOrder.findMany({
        include: {
          offer: true,
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.offerLinkOrder.findMany({
        include: {
          offerLink: true,
          devotees: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    const formattedLinkOrders = linkOrders.map(l => {
      const primaryDevotee = l.devotees.find(d => d.isPrimary) || l.devotees[0]
      return {
        id: l.id,
        isOfferLinkOrder: true,
        name: primaryDevotee?.name || 'Devotee',
        email: primaryDevotee?.email || null,
        phone: primaryDevotee?.phone || null,
        offer: {
          id: l.offerLink.id,
          title: l.offerLink.title
        },
        packageName: `Offer Link (${l.devotees.length} Devotees)`,
        amountPaid: Number(l.amount),
        paymentStatus: l.paymentStatus === 'SUCCESS' ? 'PAID' : l.paymentStatus,
        status: l.reconciledStatus || 'PROCESSING',
        createdAt: l.createdAt
      }
    })

    const combined = [...standardOrders, ...formattedLinkOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(combined)
  } catch (err) {
    return handleApiError(err)
  }
}
