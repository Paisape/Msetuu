import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const astrologer = await prisma.astrologer.findUnique({ where: { id } })

    if (!astrologer) return NextResponse.json({ error: 'Astrologer not found.' }, { status: 404 })

    return NextResponse.json(astrologer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { name, bio, image, rating, specialties, price30, offerPrice30, price60, offerPrice60, gstPercentage, gstInclusive } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) data.name = name
    if (bio !== undefined) data.bio = bio
    if (image !== undefined) data.image = image
    if (specialties !== undefined) data.specialties = specialties
    if (rating !== undefined) data.rating = rating
    if (price30 !== undefined) data.price30 = Number(price30)
    if (price60 !== undefined) data.price60 = Number(price60)
    if (offerPrice30 !== undefined) data.offerPrice30 = offerPrice30 === null || offerPrice30 === '' ? null : Number(offerPrice30)
    if (offerPrice60 !== undefined) data.offerPrice60 = offerPrice60 === null || offerPrice60 === '' ? null : Number(offerPrice60)
    if (gstPercentage !== undefined) data.gstPercentage = Number(gstPercentage)
    if (gstInclusive !== undefined) data.gstInclusive = Boolean(gstInclusive)

    const astrologer = await prisma.astrologer.update({ where: { id }, data })

    return NextResponse.json(astrologer)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.astrologer.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
