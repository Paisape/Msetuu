import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// POST /api/epuja/listings/[id]/packages — admin adds a Single/Couple/Family package to a listing
export async function POST(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { type, price, offerPrice, gstPercentage, gstInclusive } = body

    if (!type || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'type and a positive price are required.' }, { status: 400 })
    }

    if (offerPrice !== undefined && offerPrice !== null && (typeof offerPrice !== 'number' || offerPrice <= 0)) {
      return NextResponse.json({ error: 'offerPrice must be a positive number when provided.' }, { status: 400 })
    }

    const listing = await prisma.pujaListing.findUnique({ where: { id } })

    if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })

    const pkg = await prisma.pujaPackage.create({
      data: {
        pujaListingId: id,
        type,
        price,
        offerPrice: offerPrice !== undefined && offerPrice !== null ? Number(offerPrice) : null,
        gstPercentage: gstPercentage !== undefined && gstPercentage !== null ? Number(gstPercentage) : 0,
        gstInclusive: gstInclusive !== undefined ? Boolean(gstInclusive) : true
      }
    })

    return NextResponse.json(pkg, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
