import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { page, question, answer, order, active } = body

    const data: Record<string, unknown> = {}

    if (page !== undefined) data.page = page
    if (question !== undefined) data.question = question
    if (answer !== undefined) data.answer = answer
    if (order !== undefined) data.order = Number(order)
    if (active !== undefined) data.active = Boolean(active)

    const faq = await prisma.faq.update({ where: { id }, data })

    return NextResponse.json(faq)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.faq.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
