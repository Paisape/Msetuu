import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getPointsPerTag } from '@/libs/geotagPoints'

// GET /api/geotag/settings — public (the frontend shows "earn X points" messaging before login).
export async function GET() {
  try {
    const pointsPerTag = await getPointsPerTag()

    return NextResponse.json({ pointsPerTag })
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/geotag/settings — admin sets how many points one approved tag is worth.
export async function PATCH(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const points = Number(body.pointsPerTag)

    if (!Number.isInteger(points) || points < 0) {
      return NextResponse.json({ error: 'pointsPerTag must be a non-negative whole number.' }, { status: 400 })
    }

    const settings = await prisma.geotagSettings.upsert({
      where: { id: 'singleton' },
      update: { pointsPerTag: points },
      create: { id: 'singleton', pointsPerTag: points }
    })

    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}
