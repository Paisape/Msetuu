import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { page, title, subtitle, image, buttonText, buttonLink, buttonText2, buttonLink2, order, active } = body

    const data: Record<string, unknown> = {}

    if (page !== undefined) data.page = page
    if (title !== undefined) data.title = title
    if (subtitle !== undefined) data.subtitle = subtitle
    if (image !== undefined) data.image = image
    if (buttonText !== undefined) data.buttonText = buttonText
    if (buttonLink !== undefined) data.buttonLink = buttonLink
    if (buttonText2 !== undefined) data.buttonText2 = buttonText2 || null
    if (buttonLink2 !== undefined) data.buttonLink2 = buttonLink2 || null
    if (order !== undefined) data.order = Number(order)
    if (active !== undefined) data.active = Boolean(active)

    const banner = await prisma.banner.update({ where: { id }, data })

    return NextResponse.json(banner)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.banner.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
