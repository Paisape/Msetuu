import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

const MIN_DAY = 0
const MAX_DAY = 6

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const entry = await prisma.dailyDarshan.findUnique({ where: { id } })

    if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 })

    return NextResponse.json(entry)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { dayOfWeek, deityName, image, bhajanTitle, bhajanUrl, description } = body

    const data: Record<string, unknown> = {}

    if (dayOfWeek !== undefined) {
      const day = Number(dayOfWeek)

      if (!Number.isInteger(day) || day < MIN_DAY || day > MAX_DAY) {
        return NextResponse.json({ error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday).' }, { status: 400 })
      }

      const existing = await prisma.dailyDarshan.findUnique({ where: { dayOfWeek: day } })

      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Another entry already uses this day.' }, { status: 409 })
      }

      data.dayOfWeek = day
    }

    if (deityName !== undefined) data.deityName = deityName
    if (image !== undefined) data.image = image
    if (bhajanTitle !== undefined) data.bhajanTitle = bhajanTitle || null
    if (bhajanUrl !== undefined) data.bhajanUrl = bhajanUrl || null
    if (description !== undefined) data.description = description || null

    const entry = await prisma.dailyDarshan.update({ where: { id }, data })

    return NextResponse.json(entry)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.dailyDarshan.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
