import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'
import { cancelInvoiceAndRefund } from '@/libs/invoice'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
const VALID_PAYMENT_STATUSES = new Set(['PENDING', 'PAID', 'FAILED'])

// GET /api/ecommerce/[id] — order owner or an admin can view a single order
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params

    const order = await prisma.productOrder.findUnique({ where: { id }, include: { product: true } })

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not have access to this order.' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/ecommerce/[id] — admin updates shipping/payment status
export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status, paymentStatus } = body

    const data: Record<string, unknown> = {}

    if (status !== undefined) {
      if (!VALID_STATUSES.has(status)) {
        return NextResponse.json({ error: `status must be one of ${[...VALID_STATUSES].join(', ')}` }, { status: 400 })
      }

      data.status = status
    }

    if (paymentStatus !== undefined) {
      if (!VALID_PAYMENT_STATUSES.has(paymentStatus)) {
        return NextResponse.json(
          { error: `paymentStatus must be one of ${[...VALID_PAYMENT_STATUSES].join(', ')}` },
          { status: 400 }
        )
      }

      data.paymentStatus = paymentStatus
    }

    const order = await prisma.productOrder.update({ where: { id }, data, include: { product: true } })

    if (status !== undefined) {
      await logOrderTrail({ orderType: 'ECOMMERCE', orderId: id, status, actorId: admin.id, actorRole: 'ADMIN', req })

      if (status === 'CANCELLED') {
        await cancelInvoiceAndRefund('ECOMMERCE', id)
      }
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}
