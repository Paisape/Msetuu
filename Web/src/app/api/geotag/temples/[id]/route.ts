import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { name, latitude, longitude, radiusMeters } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) data.name = name

    if (latitude !== undefined) {
      const lat = Number(latitude)

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'latitude must be between -90 and 90.' }, { status: 400 })
      }

      data.latitude = lat
    }

    if (longitude !== undefined) {
      const lng = Number(longitude)

      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'longitude must be between -180 and 180.' }, { status: 400 })
      }

      data.longitude = lng
    }

    if (radiusMeters !== undefined) {
      const radius = Number(radiusMeters)

      if (!Number.isFinite(radius) || radius <= 0) {
        return NextResponse.json({ error: 'radiusMeters must be a positive number.' }, { status: 400 })
      }

      data.radiusMeters = radius
    }

    const temple = await prisma.geotagTemple.update({ where: { id }, data })

    return NextResponse.json(temple)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.geotagTemple.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
