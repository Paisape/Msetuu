import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { ensureOfferLinkOrderVideoColumns } from '@/libs/videoUpload'

// GET /api/offer/orders — Admin only: lists all offer orders (standard offer orders + offer link promotion bookings)
export async function GET(req: Request) {
  try {
    await requireAdmin()

    await ensureOfferLinkOrderVideoColumns()

    const standardOrdersPromise = prisma.offerOrder.findMany({
      include: {
        offer: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(err => {
      console.error('[OfferOrders] standardOrders error:', err)
      return []
    })

    const linkOrdersPromise = prisma.offerLinkOrder.findMany({
      include: {
        offerLink: {
          select: { id: true, title: true }
        },
        devotees: true
      },
      orderBy: { createdAt: 'desc' }
    }).catch(async err => {
      console.warn('[OfferOrders] linkOrders findMany error, retrying with column ensure:', err?.message)
      await ensureOfferLinkOrderVideoColumns()
      return prisma.offerLinkOrder.findMany({
        include: {
          offerLink: {
            select: { id: true, title: true }
          },
          devotees: true
        },
        orderBy: { createdAt: 'desc' }
      }).catch(retryErr => {
        console.error('[OfferOrders] linkOrders retry failed:', retryErr)
        return []
      })
    })

    const [standardOrders, linkOrders] = await Promise.all([standardOrdersPromise, linkOrdersPromise])

    const formattedLinkOrders = linkOrders.map(l => {
      const primaryDevotee = l.devotees.find(d => d.isPrimary) || l.devotees[0] || {}
      return {
        id: l.id,
        isOfferLinkOrder: true,
        name: primaryDevotee?.name || 'Devotee',
        email: primaryDevotee?.email || null,
        phone: primaryDevotee?.phone || null,
        pincode: primaryDevotee?.pincode || null,
        locality: primaryDevotee?.locality || null,
        city: primaryDevotee?.city || null,
        state: primaryDevotee?.state || null,
        devotees: l.devotees,
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
