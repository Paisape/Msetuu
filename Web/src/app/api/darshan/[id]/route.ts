import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const temple = await prisma.darshanTemple.findUnique({ where: { id } })

    if (!temple) return NextResponse.json({ error: 'Temple not found.' }, { status: 404 })

    return NextResponse.json(temple)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { name, location, description, image, qrCodeUrl, model3dUrl } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) data.name = name
    if (location !== undefined) data.location = location || null
    if (description !== undefined) data.description = description || null
    if (image !== undefined) data.image = image
    if (qrCodeUrl !== undefined) data.qrCodeUrl = qrCodeUrl
    if (model3dUrl !== undefined) data.model3dUrl = model3dUrl

    const temple = await prisma.darshanTemple.update({ where: { id }, data })

    return NextResponse.json(temple)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.darshanTemple.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
