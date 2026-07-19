import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

const VALID_MODULES = new Set(['epuja', 'ecommerce'])

// GET /api/categories?module=epuja — public, active categories for a module, ordered for
// display. Pass ?all=1 (admin only) to see inactive entries too, for the management console.
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const module_ = params.get('module')
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

    const categories = await prisma.category.findMany({
      where: {
        ...(module_ ? { module: module_ } : {}),
        ...(includeInactive ? {} : { active: true })
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(categories)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/categories — admin creates a category for a module
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { module: moduleValue, name, order, active } = body

    if (!moduleValue || !VALID_MODULES.has(moduleValue) || !name) {
      return NextResponse.json({ error: `module (one of: ${Array.from(VALID_MODULES).join(', ')}) and name are required.` }, { status: 400 })
    }

    try {
      const category = await prisma.category.create({
        data: {
          module: moduleValue,
          name: String(name).trim(),
          order: Number.isFinite(Number(order)) ? Number(order) : 0,
          active: active === undefined ? true : Boolean(active)
        }
      })

      return NextResponse.json(category, { status: 201 })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json({ error: 'A category with this name already exists for this module.' }, { status: 409 })
      }

      throw err
    }
  } catch (err) {
    return handleApiError(err)
  }
}
