import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'
import { cancelInvoiceAndRefund } from '@/libs/invoice'
import { expireStaleVideos } from '@/libs/videoUpload'
import { notifyOrderAccepted, notifyVideoUploaded } from '@/libs/notifyEvent'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
const VALID_PAYMENT_STATUSES = new Set(['PENDING', 'PAID', 'FAILED'])

// GET /api/chadhava/[id] — order owner or an admin can view a single order
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params

    await expireStaleVideos()

    const order = await prisma.chadhavaOrder.findUnique({ where: { id }, include: { chadhavaListing: true } })

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not have access to this order.' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/chadhava/[id] — admin marks the Chadhava complete and attaches proof media
export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status, paymentStatus, videoUrl, imageUrl } = body

    const before = await prisma.chadhavaOrder.findUnique({ where: { id }, select: { status: true, videoUrl: true, userId: true } })

    if (!before) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

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

    if (videoUrl !== undefined) data.videoUrl = videoUrl
    if (imageUrl !== undefined) data.imageUrl = imageUrl

    const order = await prisma.chadhavaOrder.update({ where: { id }, data, include: { chadhavaListing: true } })

    if (status !== undefined) {
      await logOrderTrail({ orderType: 'CHADHAVA', orderId: id, status, actorId: admin.id, actorRole: 'ADMIN', req })

      if (status === 'CANCELLED') {
        await cancelInvoiceAndRefund('CHADHAVA', id)
      } else if (before.status === 'PENDING' && status !== 'PENDING') {
        notifyOrderAccepted(before.userId, 'Chadhava', id)
      }
    }

    if (videoUrl !== undefined && videoUrl && !before.videoUrl) {
      notifyVideoUploaded(before.userId, 'Chadhava', id)
    }

    return NextResponse.json(order)
  } catch (err) {
    return handleApiError(err)
  }
}
