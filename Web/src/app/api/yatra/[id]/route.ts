import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CANCELLED'])

// GET /api/yatra/[id] — booking owner or an admin can view a single booking
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params

    const booking = await prisma.yatraBooking.findUnique({ where: { id } })

    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not have access to this booking.' }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/yatra/[id] — admin confirms a Yatra booking
export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: `status must be one of ${[...VALID_STATUSES].join(', ')}` }, { status: 400 })
    }

    const booking = await prisma.yatraBooking.update({ where: { id }, data: { status } })

    await logOrderTrail({ orderType: 'YATRA', orderId: id, status, actorId: admin.id, actorRole: 'ADMIN', req })

    return NextResponse.json(booking)
  } catch (err) {
    return handleApiError(err)
  }
}
