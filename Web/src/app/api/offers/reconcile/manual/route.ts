import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { confirmOfferBookingAndNotify } from '@/libs/offerBooking'

// POST /api/offers/reconcile/manual - Manually reconcile/confirm a pending order
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()

    const body = await req.json()
    const { orderId, paymentId, notes, forceSuccess } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId.' }, { status: 400 })
    }

    const order = await prisma.offerLinkOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    const noteText = notes
      ? `${notes} (Manually reconciled by ${admin.name || admin.email})`
      : `Manually confirmed paid by ${admin.name || admin.email}.`

    const updated = await confirmOfferBookingAndNotify({
      orderId,
      paymentId: paymentId ? paymentId.trim() : order.paymentId || undefined,
      paymentMethod: 'MANUAL_RECONCILED',
      reconciledStatus: 'RECONCILED_MANUAL',
      notes: noteText
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
