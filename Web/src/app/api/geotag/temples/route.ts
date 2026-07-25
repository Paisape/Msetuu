import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/geotag/temples — admin list of known temple coordinates used for auto-detection.
export async function GET() {
  try {
    await requireAdmin()

    const temples = await prisma.geotagTemple.findMany({ orderBy: { name: 'asc' } })

    return NextResponse.json(temples)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { name, latitude, longitude, radiusMeters } = body

    const lat = Number(latitude)
    const lng = Number(longitude)

    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'name, and valid latitude/longitude are required.' }, { status: 400 })
    }

    const radius = radiusMeters !== undefined && radiusMeters !== null && radiusMeters !== '' ? Number(radiusMeters) : 500

    if (!Number.isFinite(radius) || radius <= 0) {
      return NextResponse.json({ error: 'radiusMeters must be a positive number.' }, { status: 400 })
    }

    const temple = await prisma.geotagTemple.create({ data: { name, latitude: lat, longitude: lng, radiusMeters: radius } })

    return NextResponse.json(temple, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
