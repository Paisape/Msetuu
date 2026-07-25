import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/geotag/redemption-slabs — public. Everyone can see the reward tiers (e.g. to decide
// whether it's worth tagging more temples), with the product each slab redeems for.
export async function GET() {
  try {
    const slabs = await prisma.redemptionSlab.findMany({
      where: { active: true },
      include: { product: { select: { id: true, name: true, image: true, price: true } } },
      orderBy: { pointsRequired: 'asc' }
    })

    return NextResponse.json(slabs)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/geotag/redemption-slabs — admin defines a new reward tier, e.g. "100 points -> Product A".
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { pointsRequired, productId } = body

    const points = Number(pointsRequired)

    if (!Number.isInteger(points) || points <= 0) {
      return NextResponse.json({ error: 'pointsRequired must be a positive whole number.' }, { status: 400 })
    }

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })

    if (!product) return NextResponse.json({ error: 'Selected product does not exist.' }, { status: 404 })

    const slab = await prisma.redemptionSlab.create({
      data: { pointsRequired: points, productId },
      include: { product: { select: { id: true, name: true, image: true, price: true } } }
    })

    return NextResponse.json(slab, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
