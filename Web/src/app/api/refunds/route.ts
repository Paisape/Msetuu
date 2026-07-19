import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/refunds — admin-only list of refund records (created automatically whenever a
// PAID invoice's order gets cancelled), optionally ?status=INITIATED|PROCESSED
export async function GET(req: Request) {
  try {
    await requireAdmin()

    const status = new URL(req.url).searchParams.get('status')

    const refunds = await prisma.refund.findMany({
      where: status ? { status } : {},
      include: { invoice: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(refunds)
  } catch (err) {
    return handleApiError(err)
  }
}
