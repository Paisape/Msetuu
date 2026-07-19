import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { page, title, description, order, active } = body

    const data: Record<string, unknown> = {}

    if (page !== undefined) data.page = page
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (order !== undefined) data.order = Number(order)
    if (active !== undefined) data.active = Boolean(active)

    const step = await prisma.howItWorksStep.update({ where: { id }, data })

    return NextResponse.json(step)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.howItWorksStep.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
