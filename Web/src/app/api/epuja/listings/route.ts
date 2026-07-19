import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sanitizeMediaGallery } from '@/libs/mediaGallery'

// GET /api/epuja/listings — public catalog, optionally filtered by ?category=
export async function GET(req: Request) {
  try {
    const category = new URL(req.url).searchParams.get('category')

    const listings = await prisma.pujaListing.findMany({
      where: category ? { category } : undefined,
      include: { packages: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(listings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/epuja/listings — admin creates a Puja listing with its packages (Single/Couple/Family)
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { title, description, image, price, category, packages, templeName, templeLocation, significance, benefits, secondaryTabLabel, media } = body

    if (!title || !description || !image || typeof price !== 'number' || price <= 0 || !category) {
      return NextResponse.json(
        { error: 'title, description, image, category and a positive price are required.' },
        { status: 400 }
      )
    }

    const packageInputs: { type: string; price: number }[] = Array.isArray(packages) ? packages : []

    const listing = await prisma.pujaListing.create({
      data: {
        title,
        description,
        image,
        price,
        category,
        templeName: templeName || null,
        templeLocation: templeLocation || null,
        significance: significance || null,
        benefits: benefits || null,
        secondaryTabLabel: secondaryTabLabel || null,
        media: media !== undefined ? (sanitizeMediaGallery(media) as any) : undefined,
        packages: {
          create: packageInputs
            .filter(p => p && typeof p.price === 'number' && p.price > 0 && p.type)
            .map(p => ({ type: p.type, price: p.price }))
        }
      },
      include: { packages: true }
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
