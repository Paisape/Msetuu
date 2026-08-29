import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'
import { cancelInvoiceAndRefund } from '@/libs/invoice'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
const VALID_PAYMENT_STATUSES = new Set(['PENDING', 'PAID', 'FAILED'])

// GET /api/offer/orders/[id] — Admin only: view single order (OfferOrder or OfferLinkOrder)
export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params

    let order: any = await prisma.offerOrder.findUnique({
      where: { id },
      include: { offer: true }
    })

    if (!order) {
      // Fallback lookup for OfferLinkOrder (Promotion / Campaign Links)
      const linkOrder = await prisma.offerLinkOrder.findUnique({
        where: { id },
        include: { offerLink: true, devotees: true }
      })

      if (linkOrder) {
        const primaryDevotee = linkOrder.devotees.find(d => d.isPrimary) || linkOrder.devotees[0]
        order = {
          ...linkOrder,
          isOfferLinkOrder: true,
          offer: linkOrder.offerLink,
          name: primaryDevotee?.name || 'Devotee',
          email: primaryDevotee?.email || null,
          phone: primaryDevotee?.phone || null,
          amountPaid: Number(linkOrder.amount),
          status: linkOrder.reconciledStatus || 'PROCESSING'
        }
      }
    }

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/offer/orders/[id] — Admin updates order status
export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { status, paymentStatus } = body

    // 1. Check OfferOrder
    const existingOfferOrder = await prisma.offerOrder.findUnique({ where: { id } })

    if (existingOfferOrder) {
      const data: Record<string, unknown> = {}

      if (status !== undefined) {
        if (!VALID_STATUSES.has(status)) {
          return NextResponse.json({ error: `status must be one of ${[...VALID_STATUSES].join(', ')}` }, { status: 400 })
        }
        data.status = status
      }

      if (paymentStatus !== undefined) {
        if (!VALID_PAYMENT_STATUSES.has(paymentStatus)) {
          return NextResponse.json({ error: `paymentStatus must be one of ${[...VALID_PAYMENT_STATUSES].join(', ')}` }, { status: 400 })
        }
        data.paymentStatus = paymentStatus
      }

      const order = await prisma.offerOrder.update({
        where: { id },
        data,
        include: { offer: true }
      })

      await logOrderTrail({
        orderType: 'OFFER',
        orderId: order.id,
        status: order.status,
        note: `Order updated by admin (Status: ${status || 'unchanged'}, Payment: ${paymentStatus || 'unchanged'})`,
        actorId: admin.id,
        actorRole: 'ADMIN',
        req
      })

      if (status === 'CANCELLED' && existingOfferOrder.paymentStatus === 'PAID') {
        try {
          await cancelInvoiceAndRefund('OFFER', id)
        } catch (err) {
          console.error(`[offer] Failed to cancel invoice/refund for offer order ${id}:`, err)
        }
      }

      return NextResponse.json(order)
    }

    // 2. Check OfferLinkOrder
    const existingLinkOrder = await prisma.offerLinkOrder.findUnique({ where: { id } })

    if (existingLinkOrder) {
      const linkData: Record<string, unknown> = {}

      if (status !== undefined) {
        linkData.reconciledStatus = status
      }

      if (paymentStatus !== undefined) {
        linkData.paymentStatus = paymentStatus === 'PAID' ? 'SUCCESS' : paymentStatus
      }

      const updatedLinkOrder = await prisma.offerLinkOrder.update({
        where: { id },
        data: linkData,
        include: { offerLink: true, devotees: true }
      })

      const primaryDevotee = updatedLinkOrder.devotees.find(d => d.isPrimary) || updatedLinkOrder.devotees[0]
      const formatted = {
        ...updatedLinkOrder,
        isOfferLinkOrder: true,
        offer: updatedLinkOrder.offerLink,
        name: primaryDevotee?.name || 'Devotee',
        email: primaryDevotee?.email || null,
        phone: primaryDevotee?.phone || null,
        amountPaid: Number(updatedLinkOrder.amount),
        status: updatedLinkOrder.reconciledStatus
      }

      await logOrderTrail({
        orderType: 'OFFER',
        orderId: updatedLinkOrder.id,
        status: updatedLinkOrder.reconciledStatus,
        note: `Offer link order updated by admin (Status: ${status || 'unchanged'}, Payment: ${paymentStatus || 'unchanged'})`,
        actorId: admin.id,
        actorRole: 'ADMIN',
        req
      })

      return NextResponse.json(formatted)
    }

    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  } catch (err) {
    return handleApiError(err)
  }
}
