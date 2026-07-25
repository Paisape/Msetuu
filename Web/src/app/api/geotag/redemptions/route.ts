import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/geotag/redemptions — the logged-in user's own redemption history, or ?all=1 for admins.
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const requests = await prisma.redemptionRequest.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: {
        slab: { include: { product: { select: { id: true, name: true, image: true } } } },
        ...(wantsAll && user.role === 'ADMIN' ? { user: { select: { name: true, email: true, phone: true } } } : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (err) {
    return handleApiError(err)
  }
}
