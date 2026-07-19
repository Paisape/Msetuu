import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

const VALID_MODULES = new Set(['epuja', 'ecommerce'])

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { module: moduleValue, name, order, active } = body

    if (moduleValue !== undefined && !VALID_MODULES.has(moduleValue)) {
      return NextResponse.json({ error: `module must be one of: ${Array.from(VALID_MODULES).join(', ')}.` }, { status: 400 })
    }

    const data: Record<string, unknown> = {}

    if (moduleValue !== undefined) data.module = moduleValue
    if (name !== undefined) data.name = String(name).trim()
    if (order !== undefined) data.order = Number(order)
    if (active !== undefined) data.active = Boolean(active)

    try {
      const category = await prisma.category.update({ where: { id }, data })

      return NextResponse.json(category)
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

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
