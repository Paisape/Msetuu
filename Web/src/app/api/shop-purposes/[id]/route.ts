import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { label, image, order } = body

    const data: Record<string, unknown> = {}

    if (label !== undefined) data.label = label
    if (image !== undefined) data.image = image
    if (order !== undefined) data.order = Number(order)

    const purpose = await prisma.shopPurpose.update({ where: { id }, data })

    return NextResponse.json(purpose)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.shopPurpose.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
