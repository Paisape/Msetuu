import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/jyotish/astrologers — public list of astrologers
export async function GET() {
  try {
    const astrologers = await prisma.astrologer.findMany({ orderBy: { rating: 'desc' } })

    return NextResponse.json(astrologers)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/jyotish/astrologers — admin adds an astrologer
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { name, bio, image, rating, specialties, price30, offerPrice30, price60, offerPrice60, gstPercentage, gstInclusive } = body

    if (!name || !bio || !image || !specialties) {
      return NextResponse.json({ error: 'name, bio, image and specialties are required.' }, { status: 400 })
    }

    if (price30 === undefined || price60 === undefined || Number(price30) <= 0 || Number(price60) <= 0) {
      return NextResponse.json({ error: 'price30 and price60 (30-minute and 60-minute consultation prices) are required and must be greater than 0.' }, { status: 400 })
    }

    const astrologer = await prisma.astrologer.create({
      data: {
        name,
        bio,
        image,
        specialties,
        rating: typeof rating === 'number' ? rating : 5.0,
        price30: Number(price30),
        offerPrice30: offerPrice30 !== undefined && offerPrice30 !== null && offerPrice30 !== '' ? Number(offerPrice30) : null,
        price60: Number(price60),
        offerPrice60: offerPrice60 !== undefined && offerPrice60 !== null && offerPrice60 !== '' ? Number(offerPrice60) : null,
        gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : 0,
        gstInclusive: gstInclusive !== undefined ? Boolean(gstInclusive) : true
      }
    })

    return NextResponse.json(astrologer, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
