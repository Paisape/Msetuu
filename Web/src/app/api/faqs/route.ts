import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/faqs?page=chadhava — public, active FAQs for a page, ordered for display.
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

    const faqs = await prisma.faq.findMany({
      where: {
        ...(page ? { page } : {}),
        ...(includeInactive ? {} : { active: true })
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json(faqs)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/faqs — admin creates a FAQ entry for a page
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { page, question, answer, order, active } = body

    if (!page || !question || !answer) {
      return NextResponse.json({ error: 'page, question and answer are required.' }, { status: 400 })
    }

    const faq = await prisma.faq.create({
      data: {
        page,
        question,
        answer,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        active: active === undefined ? true : Boolean(active)
      }
    })

    return NextResponse.json(faq, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
