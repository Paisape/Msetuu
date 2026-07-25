import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { pointsRequired, productId, active } = body

    const data: Record<string, unknown> = {}

    if (pointsRequired !== undefined) {
      const points = Number(pointsRequired)

      if (!Number.isInteger(points) || points <= 0) {
        return NextResponse.json({ error: 'pointsRequired must be a positive whole number.' }, { status: 400 })
      }

      data.pointsRequired = points
    }

    if (productId !== undefined) {
      const product = await prisma.product.findUnique({ where: { id: productId } })

      if (!product) return NextResponse.json({ error: 'Selected product does not exist.' }, { status: 404 })
      data.productId = productId
    }

    if (active !== undefined) data.active = Boolean(active)

    const slab = await prisma.redemptionSlab.update({
      where: { id },
      data,
      include: { product: { select: { id: true, name: true, image: true, price: true } } }
    })

    return NextResponse.json(slab)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.redemptionSlab.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
