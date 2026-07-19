import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/jyotish/time-slots — public, active slots ordered for display on the booking form.
// Pass ?all=1 (admin only) to see inactive entries too, for the management console.
export async function GET(req: Request) {
  try {
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    let includeInactive = false

    if (wantsAll) {
      try {
        await requireAdmin()
        includeInactive = true
      } catch {
        // Not an admin — fall back to the public (active-only) view instead of erroring
      }
    }

    const slots = await prisma.consultationTimeSlot.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ order: 'asc' }, { startTime: 'asc' }]
    })

    return NextResponse.json(slots)
  } catch (err) {
    return handleApiError(err)
  }
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

// POST /api/jyotish/time-slots — admin creates a bookable time slot
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { label, startTime, order, active } = body

    if (!label || !startTime) {
      return NextResponse.json({ error: 'label and startTime are required.' }, { status: 400 })
    }

    if (!TIME_PATTERN.test(startTime)) {
      return NextResponse.json({ error: 'startTime must be in 24-hour HH:mm format, e.g. 09:00.' }, { status: 400 })
    }

    const slot = await prisma.consultationTimeSlot.create({
      data: {
        label,
        startTime,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        active: active === undefined ? true : Boolean(active)
      }
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
