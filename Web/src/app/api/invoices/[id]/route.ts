import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/invoices/[id] — the invoice owner or an admin can view/print it
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { refund: true } })

    if (!invoice) return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })

    if (invoice.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not have access to this invoice.' }, { status: 403 })
    }

    return NextResponse.json(invoice)
  } catch (err) {
    return handleApiError(err)
  }
}
