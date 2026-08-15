import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// POST /api/offers/reconcile/manual - Manually reconcile/confirm a pending order
export async function POST(req: Request) {
  try {
    const admin = await requireUser()

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

    const data: Record<string, any> = {
      reconciledStatus: 'RECONCILED_MANUAL',
      reconciledAt: new Date(),
      reconciliationNotes: notes ? `${notes} (Manually reconciled by ${admin.name || admin.email})` : `Manually confirmed paid by ${admin.name || admin.email}.`
    }

    if (paymentId) {
      data.paymentId = paymentId.trim()
    }

    if (forceSuccess) {
      data.paymentStatus = 'SUCCESS'
    }

    const updated = await prisma.offerLinkOrder.update({
      where: { id: orderId },
      data,
      include: {
        devotees: true
      }
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
