import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { enforceRateLimit } from '@/libs/rateLimit'

// POST /api/geotag/redeem — logged-in user cashes in points for a slab's product.
// { slabId, shippingAddress }
//
// Points are deducted the moment the request is created (not on admin approval), using an
// atomic `updateMany` guarded by `points >= pointsRequired` — the same pattern used for
// payment idempotency elsewhere in this app. That guard means two concurrent redemption
// requests can never both succeed off the same points, even under a race. If an admin later
// rejects the request, the points are refunded (see PATCH /api/geotag/redemptions/[id]).
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const rateLimited = enforceRateLimit(req, 'geotag-redeem', { limit: 20, windowMs: 60 * 60 * 1000, identifier: user.id, skipIp: true })

    if (rateLimited) return rateLimited

    const body = await req.json()
    const { slabId, shippingAddress } = body

    if (!slabId || typeof slabId !== 'string') {
      return NextResponse.json({ error: 'slabId is required.' }, { status: 400 })
    }

    const slab = await prisma.redemptionSlab.findUnique({ where: { id: slabId }, include: { product: true } })

    if (!slab || !slab.active) {
      return NextResponse.json({ error: 'This reward is not available.' }, { status: 404 })
    }

    const deducted = await prisma.user.updateMany({
      where: { id: user.id, points: { gte: slab.pointsRequired } },
      data: { points: { decrement: slab.pointsRequired } }
    })

    if (deducted.count === 0) {
      return NextResponse.json({ error: `You need ${slab.pointsRequired} points to redeem this reward.` }, { status: 400 })
    }

    const request = await prisma.$transaction(async (tx: any) => {
      const created = await tx.redemptionRequest.create({
        data: {
          userId: user.id,
          slabId: slab.id,
          pointsSpent: slab.pointsRequired,
          shippingAddress: typeof shippingAddress === 'string' ? shippingAddress.slice(0, 500) : null
        },
        include: { slab: { include: { product: true } } }
      })

      await tx.pointsTransaction.create({
        data: {
          userId: user.id,
          amount: -slab.pointsRequired,
          reason: `Redeemed: ${slab.product.name}`,
          redemptionId: created.id
        }
      })

      return created
    })

    return NextResponse.json(request, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
