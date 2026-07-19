import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'
import { cancelInvoiceAndRefund } from '@/libs/invoice'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
const VALID_PAYMENT_STATUSES = new Set(['PENDING', 'PAID', 'FAILED'])

// GET /api/offer/orders/[id] — Admin only: view single order
export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params

    const order = await prisma.offerOrder.findUnique({
      where: { id },
      include: { offer: true }
    })

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

    const existing = await prisma.offerOrder.findUnique({ where: { id } })

    if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

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

    // Log the audit trail
    await logOrderTrail({
      orderType: 'OFFER',
      orderId: order.id,
      status: order.status,
      note: `Order updated by admin (Status: ${status || 'unchanged'}, Payment: ${paymentStatus || 'unchanged'})`,
      actorId: admin.id,
      actorRole: 'ADMIN',
      req
    })

    // If cancelled, cancel the corresponding invoice if it was paid
    if (status === 'CANCELLED' && existing.paymentStatus === 'PAID') {
      try {
        await cancelInvoiceAndRefund('OFFER', id)
      } catch (err) {
        console.error(`[offer] Failed to cancel invoice/refund for offer order ${id}:`, err)
      }
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}
