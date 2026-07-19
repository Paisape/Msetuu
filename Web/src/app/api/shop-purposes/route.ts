import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/shop-purposes — public, ordered tiles for the "Shop by Purpose" sections
export async function GET() {
  try {
    const purposes = await prisma.shopPurpose.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })

    return NextResponse.json(purposes)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/shop-purposes — admin adds a purpose tile
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { label, image, order } = body

    if (!label || !image) {
      return NextResponse.json({ error: 'label and image are required.' }, { status: 400 })
    }

    const purpose = await prisma.shopPurpose.create({
      data: { label, image, order: Number.isFinite(Number(order)) ? Number(order) : 0 }
    })

    return NextResponse.json(purpose, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
