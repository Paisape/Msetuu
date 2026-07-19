import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/refunds/[id] — admin marks a refund as PROCESSED once the money has actually
// been sent back to the customer (manually, outside the app — no payment gateway is wired up).
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (status !== 'PROCESSED' && status !== 'INITIATED') {
      return NextResponse.json({ error: 'status must be INITIATED or PROCESSED.' }, { status: 400 })
    }

    const refund = await prisma.refund.update({
      where: { id },
      data: { status, processedAt: status === 'PROCESSED' ? new Date() : null },
      include: { invoice: true }
    })

    return NextResponse.json(refund)
  } catch (err) {
    return handleApiError(err)
  }
}
