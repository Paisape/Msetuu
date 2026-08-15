import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/offers/reconcile - Fetch pending orders and reconciliation run logs (Admin only)
export async function GET() {
  try {
    await requireUser()

    const [runs, pendingOrders] = await Promise.all([
      prisma.reconciliationRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.offerLinkOrder.findMany({
        where: { paymentStatus: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
          offerLink: { select: { title: true } },
          devotees: true
        }
      })
    ])

    return NextResponse.json({ runs, pendingOrders })
  } catch (err) {
    return handleApiError(err)
  }
}
