import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { label, startTime, order, active } = body

    if (startTime !== undefined && !TIME_PATTERN.test(startTime)) {
      return NextResponse.json({ error: 'startTime must be in 24-hour HH:mm format, e.g. 09:00.' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}

    if (label !== undefined) data.label = label
    if (startTime !== undefined) data.startTime = startTime
    if (order !== undefined) data.order = Number(order)
    if (active !== undefined) data.active = Boolean(active)

    const slot = await prisma.consultationTimeSlot.update({ where: { id }, data })

    return NextResponse.json(slot)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.consultationTimeSlot.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
