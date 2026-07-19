import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/how-it-works?page=chadhava — public, active steps for a page, ordered for display.
// Pass ?all=1 (admin only) to see inactive entries too, for the management console.
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

    const steps = await prisma.howItWorksStep.findMany({
      where: {
        ...(page ? { page } : {}),
        ...(includeInactive ? {} : { active: true })
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json(steps)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/how-it-works — admin creates a step for a page
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { page, title, description, order, active } = body

    if (!page || !title || !description) {
      return NextResponse.json({ error: 'page, title and description are required.' }, { status: 400 })
    }

    const step = await prisma.howItWorksStep.create({
      data: {
        page,
        title,
        description,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        active: active === undefined ? true : Boolean(active)
      }
    })

    return NextResponse.json(step, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
