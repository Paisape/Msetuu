import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/geotag/redemptions/[id] — admin marks a redemption FULFILLED (shipped/handed
// over — points stay spent) or REJECTED (points are refunded).
// { status: 'FULFILLED' | 'REJECTED' }
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (status !== 'FULFILLED' && status !== 'REJECTED') {
      return NextResponse.json({ error: "status must be 'FULFILLED' or 'REJECTED'." }, { status: 400 })
    }

    const existing = await prisma.redemptionRequest.findUnique({ where: { id }, include: { slab: { include: { product: true } } } })

    if (!existing) return NextResponse.json({ error: 'Redemption request not found.' }, { status: 404 })

    if (existing.status !== 'PENDING') {
      return NextResponse.json({ error: `This request was already ${existing.status.toLowerCase()}.` }, { status: 409 })
    }

    if (status === 'FULFILLED') {
      const updated = await prisma.redemptionRequest.update({
        where: { id },
        data: { status: 'FULFILLED', reviewedAt: new Date() }
      })

      return NextResponse.json(updated)
    }

    // REJECTED — refund the spent points, atomically alongside the status change and ledger entry.
    const [, , updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: existing.userId }, data: { points: { increment: existing.pointsSpent } } }),
      prisma.pointsTransaction.create({
        data: {
          userId: existing.userId,
          amount: existing.pointsSpent,
          reason: `Refund: redemption rejected (${existing.slab.product.name})`,
          redemptionId: existing.id
        }
      }),
      prisma.redemptionRequest.update({
        where: { id },
        data: { status: 'REJECTED', reviewedAt: new Date() }
      })
    ])

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}
