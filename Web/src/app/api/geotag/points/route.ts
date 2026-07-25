import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/geotag/points — the logged-in user's current balance + ledger history.
export async function GET() {
  try {
    const user = await requireUser()

    const [balance, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, select: { points: true } }),
      prisma.pointsTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
    ])

    return NextResponse.json({ points: balance?.points ?? 0, transactions })
  } catch (err) {
    return handleApiError(err)
  }
}
