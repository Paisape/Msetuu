import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sanitizeMediaGallery } from '@/libs/mediaGallery'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const listing = await prisma.chadhavaListing.findUnique({ where: { id } })

    if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })

    return NextResponse.json(listing)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { title, description, location, image, price, offerPrice, gstPercentage, gstInclusive, significance, benefits, secondaryTabLabel, media } = body

    const data: Record<string, unknown> = {}

    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (location !== undefined) data.location = location
    if (image !== undefined) data.image = image
    if (gstPercentage !== undefined) data.gstPercentage = gstPercentage === null ? 0 : Number(gstPercentage)
    if (gstInclusive !== undefined) data.gstInclusive = Boolean(gstInclusive)
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

    const listing = await prisma.chadhavaListing.update({ where: { id }, data })

    return NextResponse.json(listing)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.chadhavaListing.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
