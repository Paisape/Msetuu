import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/offers - List all offer links (Admin only)
export async function GET() {
  try {
    await requireUser() // Require admin authentication

    const offerLinks = await prisma.offerLink.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true, analytics: true }
        }
      }
    })

    return NextResponse.json(offerLinks)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/offers - Create a new offer link (Admin only)
export async function POST(req: Request) {
  try {
    await requireUser()

    const body = await req.json()
    const { slug, title, salePrice, offerPrice, gstIncluded, gstRate, htmlContent } = body

    if (!slug || !title || salePrice === undefined || offerPrice === undefined || !htmlContent) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
    const existing = await prisma.offerLink.findUnique({ where: { slug: cleanSlug } })
    if (existing) {
      return NextResponse.json({ error: 'An offer with this slug already exists.' }, { status: 400 })
    }

    const offer = await prisma.offerLink.create({
      data: {
        slug: cleanSlug,
        title: title.trim(),
        salePrice: Number(salePrice),
        offerPrice: Number(offerPrice),
        gstIncluded: Boolean(gstIncluded),
        gstRate: gstRate !== undefined ? Number(gstRate) : 18.00,
        htmlContent
      }
    })

    return NextResponse.json({ success: true, offer })
  } catch (err) {
    return handleApiError(err)
  }
}
