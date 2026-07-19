import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sanitizeMediaGallery } from '@/libs/mediaGallery'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const listing = await prisma.pujaListing.findUnique({ where: { id }, include: { packages: true } })

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
    const { title, description, image, price, category, templeName, templeLocation, significance, benefits, secondaryTabLabel, media } = body

    const data: Record<string, unknown> = {}

    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (image !== undefined) data.image = image
    if (category !== undefined) data.category = category
    if (templeName !== undefined) data.templeName = templeName || null
    if (templeLocation !== undefined) data.templeLocation = templeLocation || null
    if (significance !== undefined) data.significance = significance || null
    if (benefits !== undefined) data.benefits = benefits || null
    if (secondaryTabLabel !== undefined) data.secondaryTabLabel = secondaryTabLabel || null
    if (media !== undefined) data.media = sanitizeMediaGallery(media)

    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json({ error: 'price must be a positive number.' }, { status: 400 })
      }

      data.price = price
    }

    const listing = await prisma.pujaListing.update({ where: { id }, data, include: { packages: true } })

    return NextResponse.json(listing)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.pujaListing.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
