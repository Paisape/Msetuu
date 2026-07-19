import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/kundli/listings — public catalog of handcrafted Kundli types (Premium Janam Kundli, etc.)
export async function GET() {
  try {
    const listings = await prisma.kundliListing.findMany({ orderBy: { createdAt: 'desc' } })

    return NextResponse.json(listings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/kundli/listings — admin creates a new Kundli type
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { title, description, delivery, image, price, offerPrice, gstPercentage, gstInclusive } = body

    if (!title || !description || !delivery || !image || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'title, description, delivery, image and a positive price are required.' },
        { status: 400 }
      )
    }

    if (offerPrice !== undefined && offerPrice !== null && (typeof offerPrice !== 'number' || offerPrice <= 0)) {
      return NextResponse.json({ error: 'offerPrice must be a positive number when provided.' }, { status: 400 })
    }

    const listing = await prisma.kundliListing.create({
      data: {
        title,
        description,
        delivery,
        image,
        price,
        offerPrice: offerPrice !== undefined && offerPrice !== null ? Number(offerPrice) : null,
        gstPercentage: gstPercentage !== undefined && gstPercentage !== null ? Number(gstPercentage) : 0,
        gstInclusive: gstInclusive !== undefined ? Boolean(gstInclusive) : true
      }
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
