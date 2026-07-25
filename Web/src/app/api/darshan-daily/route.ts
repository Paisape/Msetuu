import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

const MIN_DAY = 0 // Sunday
const MAX_DAY = 6 // Saturday

// GET /api/darshan-daily — public. Returns all configured days (frontend picks today's entry
// itself via `Date#getDay()`), or a single day with ?day=0-6.
export async function GET(req: Request) {
  try {
    const dayParam = new URL(req.url).searchParams.get('day')

    if (dayParam !== null) {
      const day = Number(dayParam)

      if (!Number.isInteger(day) || day < MIN_DAY || day > MAX_DAY) {
        return NextResponse.json({ error: 'day must be an integer between 0 (Sunday) and 6 (Saturday).' }, { status: 400 })
      }

      const entry = await prisma.dailyDarshan.findUnique({ where: { dayOfWeek: day } })

      return NextResponse.json(entry ?? null)
    }

    const entries = await prisma.dailyDarshan.findMany({ orderBy: { dayOfWeek: 'asc' } })

    return NextResponse.json(entries)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/darshan-daily — admin adds the deity image + bhajan for one day of the week.
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { dayOfWeek, deityName, image, bhajanTitle, bhajanUrl, description } = body

    const day = Number(dayOfWeek)

    if (!Number.isInteger(day) || day < MIN_DAY || day > MAX_DAY) {
      return NextResponse.json({ error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday).' }, { status: 400 })
    }

    if (!deityName || !image) {
      return NextResponse.json({ error: 'deityName and image are required.' }, { status: 400 })
    }

    const existing = await prisma.dailyDarshan.findUnique({ where: { dayOfWeek: day } })

    if (existing) {
      return NextResponse.json({ error: 'This day already has an entry — edit it instead of adding a duplicate.' }, { status: 409 })
    }

    const entry = await prisma.dailyDarshan.create({
      data: {
        dayOfWeek: day,
        deityName,
        image,
        bhajanTitle: bhajanTitle || null,
        bhajanUrl: bhajanUrl || null,
        description: description || null
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
