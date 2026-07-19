import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/banners?page=home — public, active banners for a page, ordered for display.
// Pass ?all=1 (admin only) to see inactive banners too, for the management console.
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const page = params.get('page')
    const wantsAll = params.get('all') === '1'

    let includeInactive = false

    if (wantsAll) {
      try {
        await requireAdmin()
        includeInactive = true
      } catch {
        // Not an admin — fall back to the public (active-only) view instead of erroring
      }
    }

    const banners = await prisma.banner.findMany({
      where: {
        ...(page ? { page } : {}),
        ...(includeInactive ? {} : { active: true })
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(banners)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/banners — admin creates a banner/slide
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { page, title, subtitle, image, buttonText, buttonLink, buttonText2, buttonLink2, order, active } = body

    if (!page || !title || !image) {
      return NextResponse.json({ error: 'page, title and image are required.' }, { status: 400 })
    }

    const banner = await prisma.banner.create({
      data: {
        page,
        title,
        subtitle,
        image,
        buttonText,
        buttonLink,
        buttonText2: buttonText2 || null,
        buttonLink2: buttonLink2 || null,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        active: active === undefined ? true : Boolean(active)
      }
    })

    return NextResponse.json(banner, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
