import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sanitizeMediaGallery } from '@/libs/mediaGallery'

// GET /api/ecommerce/products — public catalog, filterable by category, purpose, planet, bestseller
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const category = params.get('category')
    const purpose = params.get('purpose')
    const planet = params.get('planet')
    const bestSellerOnly = params.get('bestseller') === '1'

    const products = await prisma.product.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(purpose ? { purpose } : {}),
        ...(planet ? { planet } : {}),
        ...(bestSellerOnly ? { isBestSeller: true } : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/ecommerce/products — admin adds a product
export async function POST(req: Request) {
  try {
    await requireAdmin()

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

    if (!name || !category || typeof price !== 'number' || price <= 0 || !image || !description) {
      return NextResponse.json(
        { error: 'name, category, image, description and a positive price are required.' },
        { status: 400 }
      )
    }

    if (offerPrice !== undefined && offerPrice !== null && (typeof offerPrice !== 'number' || offerPrice <= 0)) {
      return NextResponse.json({ error: 'offerPrice must be a positive number when provided.' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price,
        offerPrice: offerPrice !== undefined && offerPrice !== null ? Number(offerPrice) : null,
        gstPercentage: gstPercentage !== undefined && gstPercentage !== null ? Number(gstPercentage) : 0,
        gstInclusive: gstInclusive !== undefined ? Boolean(gstInclusive) : true,
        image,
        description,
        isBestSeller: Boolean(isBestSeller),
        planet,
        purpose,
        rating: rating !== undefined && rating !== null ? Number(rating) : 5.0,
        reviewsCount: reviewsCount !== undefined && reviewsCount !== null ? Number(reviewsCount) : 0,
        sourceName: sourceName || null,
        sourceLocation: sourceLocation || null,
        significance: significance || null,
        benefits: benefits || null,
        secondaryTabLabel: secondaryTabLabel || null,
        media: media !== undefined ? (sanitizeMediaGallery(media) as any) : undefined
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
