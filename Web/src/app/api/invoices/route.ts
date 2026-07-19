import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/invoices — admin sees all invoices (optionally ?status=PAID|CANCELLED), a regular
// customer only ever sees their own.
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const params = new URL(req.url).searchParams
    const status = params.get('status')
    const orderType = params.get('orderType')
    const orderId = params.get('orderId')

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(user.role === 'ADMIN' ? {} : { userId: user.id }),
        ...(status ? { status } : {}),
        ...(orderType ? { orderType } : {}),
        ...(orderId ? { orderId } : {})
      },
      include: { refund: true },
      orderBy: { issuedAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (err) {
    return handleApiError(err)
  }
}
