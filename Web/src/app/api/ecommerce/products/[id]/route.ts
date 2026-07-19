import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sanitizeMediaGallery } from '@/libs/mediaGallery'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

    return NextResponse.json(product)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()

    const {
      name,
      category,
      price,
      offerPrice,
      gstPercentage,
      gstInclusive,
      image,
      description,
      isBestSeller,
      planet,
      purpose,
      rating,
      reviewsCount,
      sourceName,
      sourceLocation,
      significance,
      benefits,
      secondaryTabLabel,
      media
    } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) data.name = name
    if (category !== undefined) data.category = category
    if (image !== undefined) data.image = image
    if (description !== undefined) data.description = description
    if (isBestSeller !== undefined) data.isBestSeller = Boolean(isBestSeller)
    if (planet !== undefined) data.planet = planet
    if (purpose !== undefined) data.purpose = purpose
    if (gstPercentage !== undefined) data.gstPercentage = gstPercentage === null ? 0 : Number(gstPercentage)
    if (gstInclusive !== undefined) data.gstInclusive = Boolean(gstInclusive)
    if (rating !== undefined) data.rating = Number(rating)
    if (reviewsCount !== undefined) data.reviewsCount = Number(reviewsCount)
    if (sourceName !== undefined) data.sourceName = sourceName || null
    if (sourceLocation !== undefined) data.sourceLocation = sourceLocation || null
    if (significance !== undefined) data.significance = significance || null
    if (benefits !== undefined) data.benefits = benefits || null
    if (secondaryTabLabel !== undefined) data.secondaryTabLabel = secondaryTabLabel || null
    if (media !== undefined) data.media = sanitizeMediaGallery(media)

    if (offerPrice !== undefined) {
      if (offerPrice !== null && (typeof offerPrice !== 'number' || offerPrice <= 0)) {
        return NextResponse.json({ error: 'offerPrice must be a positive number when provided.' }, { status: 400 })
      }

      data.offerPrice = offerPrice === null ? null : Number(offerPrice)
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json({ error: 'price must be a positive number.' }, { status: 400 })
      }

      data.price = price
    }

    const product = await prisma.product.update({ where: { id }, data })

    return NextResponse.json(product)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
