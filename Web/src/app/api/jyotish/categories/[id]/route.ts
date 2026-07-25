import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const category = await prisma.jyotishCategory.findUnique({ where: { id } })

    if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })

    return NextResponse.json(category)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { name, price30, offerPrice30, price60, offerPrice60, price90, offerPrice90, gstPercentage, gstInclusive, active } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      if (!String(name).trim()) return NextResponse.json({ error: 'name cannot be empty.' }, { status: 400 })
      data.name = String(name).trim()
    }

    for (const [key, label] of [['price30', 'price30 (Half Hour price)'], ['price60', 'price60 (1 Hour price)'], ['price90', 'price90 (1.5 Hours price)']] as const) {
      const value = body[key]

      if (value === undefined) continue

      const num = Number(value)

      if (!Number.isFinite(num) || num <= 0) {
        return NextResponse.json({ error: `${label} must be greater than 0.` }, { status: 400 })
      }

      data[key] = num
    }

    if (offerPrice30 !== undefined) data.offerPrice30 = offerPrice30 === null || offerPrice30 === '' ? null : Number(offerPrice30)
    if (offerPrice60 !== undefined) data.offerPrice60 = offerPrice60 === null || offerPrice60 === '' ? null : Number(offerPrice60)
    if (offerPrice90 !== undefined) data.offerPrice90 = offerPrice90 === null || offerPrice90 === '' ? null : Number(offerPrice90)
    if (gstPercentage !== undefined) data.gstPercentage = Number(gstPercentage)
    if (gstInclusive !== undefined) data.gstInclusive = Boolean(gstInclusive)
    if (active !== undefined) data.active = Boolean(active)

    const category = await prisma.jyotishCategory.update({ where: { id }, data })

    return NextResponse.json(category)
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 })
    }

    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.jyotishCategory.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
