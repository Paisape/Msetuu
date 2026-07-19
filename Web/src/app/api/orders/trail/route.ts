import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { getOrderOwnerId } from '@/libs/orderLookup'
import type { OrderType } from '@/libs/orderTrail'

const VALID_TYPES = new Set(['CHADHAVA', 'EPUJA', 'JYOTISH', 'KUNDLI', 'ECOMMERCE', 'YATRA'])

// GET /api/orders/trail?type=CHADHAVA&id=... — status history for one order.
// Customers see status + timestamp only; admins additionally see ip/userAgent/actor
// ("telemetry"), matching what's shown in the admin order-detail page vs a customer's own
// order page.
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const params = new URL(req.url).searchParams
    const orderType = params.get('type') as OrderType | null
    const orderId = params.get('id')

    if (!orderType || !VALID_TYPES.has(orderType) || !orderId) {
      return NextResponse.json({ error: 'type and id query params are required.' }, { status: 400 })
    }

    if (user.role !== 'ADMIN') {
      const ownerId = await getOrderOwnerId(orderType, orderId)

      if (ownerId !== user.id) {
        return NextResponse.json({ error: 'You do not have access to this order.' }, { status: 403 })
      }
    }

    const trail = await prisma.orderTrail.findMany({
      where: { orderType, orderId },
      orderBy: { createdAt: 'asc' },
      include: { actor: { select: { name: true, email: true, role: true } } }
    })

    const isAdmin = user.role === 'ADMIN'

    const shaped = trail.map(t => ({
      id: t.id,
      status: t.status,
      note: t.note,
      createdAt: t.createdAt,
      actorName: t.actor?.name || (t.actorRole === 'SYSTEM' ? 'System' : 'Customer'),
      actorRole: t.actorRole,

      // Telemetry — admin only.
      ip: isAdmin ? t.ip : undefined,
      userAgent: isAdmin ? t.userAgent : undefined
    }))

    return NextResponse.json(shaped)
  } catch (err) {
    return handleApiError(err)
  }
}
