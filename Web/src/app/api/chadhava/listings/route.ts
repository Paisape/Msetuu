import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sanitizeMediaGallery } from '@/libs/mediaGallery'

// GET /api/chadhava/listings — public catalog of available Chadhava offerings
export async function GET() {
  try {
    const listings = await prisma.chadhavaListing.findMany({ orderBy: { createdAt: 'desc' } })

    return NextResponse.json(listings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/chadhava/listings — admin creates a new Chadhava listing
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { title, description, location, image, price, offerPrice, gstPercentage, gstInclusive, significance, benefits, secondaryTabLabel, media } = body

    if (!title || !description || !image || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'title, description, image and a positive price are required.' },
        { status: 400 }
      )
    }

    if (offerPrice !== undefined && offerPrice !== null && (typeof offerPrice !== 'number' || offerPrice <= 0)) {
      return NextResponse.json({ error: 'offerPrice must be a positive number when provided.' }, { status: 400 })
    }

    const listing = await prisma.chadhavaListing.create({
      data: {
        title,
        description,
        location,
        image,
        price,
        offerPrice: offerPrice !== undefined && offerPrice !== null ? Number(offerPrice) : null,
        gstPercentage: gstPercentage !== undefined && gstPercentage !== null ? Number(gstPercentage) : 0,
        gstInclusive: gstInclusive !== undefined ? Boolean(gstInclusive) : true,
        significance: significance || null,
        benefits: benefits || null,
        secondaryTabLabel: secondaryTabLabel || null,
        media: media !== undefined ? (sanitizeMediaGallery(media) as any) : undefined
      }
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
