import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/offer/orders — Admin only: lists all offer orders
export async function GET(req: Request) {
  try {
    await requireAdmin()

    const orders = await prisma.offerOrder.findMany({
      include: {
        offer: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}
