import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/jyotish/categories
//   ?all=1 — admin, every category (for the CMS list, including inactive ones)
//   (no params) — public, active categories only, for the booking form's price dropdown
export async function GET(req: Request) {
  try {
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const categories = await prisma.jyotishCategory.findMany({
      where: wantsAll ? {} : { active: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (err) {
    return handleApiError(err)
  }
}

// A category needs a positive base price for every duration tier — an admin can't leave one
// tier at 0 by accident and have the booking form silently offer a free consultation.
function parseTierPrice(value: unknown, label: string): number | NextResponse {
  const num = Number(value)

  if (value === undefined || value === null || value === '' || !Number.isFinite(num) || num <= 0) {
    return NextResponse.json({ error: `${label} is required and must be greater than 0.` }, { status: 400 })
  }

  return num
}

function parseOfferPrice(value: unknown): number | null {
  return value !== undefined && value !== null && value !== '' ? Number(value) : null
}

// POST /api/jyotish/categories — admin adds a consultation category with per-duration pricing
// (Half Hour/1 Hour/1.5 Hours) — the booking form prices a session as category × duration.
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { name, price30, offerPrice30, price60, offerPrice60, price90, offerPrice90, gstPercentage, gstInclusive, active } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required.' }, { status: 400 })
    }

    const parsedPrice30 = parseTierPrice(price30, 'price30 (Half Hour price)')

    if (parsedPrice30 instanceof NextResponse) return parsedPrice30

    const parsedPrice60 = parseTierPrice(price60, 'price60 (1 Hour price)')

    if (parsedPrice60 instanceof NextResponse) return parsedPrice60

    const parsedPrice90 = parseTierPrice(price90, 'price90 (1.5 Hours price)')

    if (parsedPrice90 instanceof NextResponse) return parsedPrice90

    const category = await prisma.jyotishCategory.create({
      data: {
        name: name.trim(),
        price30: parsedPrice30,
        offerPrice30: parseOfferPrice(offerPrice30),
        price60: parsedPrice60,
        offerPrice60: parseOfferPrice(offerPrice60),
        price90: parsedPrice90,
        offerPrice90: parseOfferPrice(offerPrice90),
        gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : 0,
        gstInclusive: gstInclusive !== undefined ? Boolean(gstInclusive) : true,
        active: active !== undefined ? Boolean(active) : true
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 })
    }

    return handleApiError(err)
  }
}
