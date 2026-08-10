import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/admin/referrals/payouts — lists all payout requests globally
export async function GET() {
  try {
    await requireAdmin()

    const payouts = await prisma.payoutRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      payouts
    })
  } catch (err) {
    return handleApiError(err)
  }
}
