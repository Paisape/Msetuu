import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/geotag — logged-in user's own geo-tagged photos, or ?all=1 for admins
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const photos = await prisma.geoTagPhoto.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(photos)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/geotag — logged-in user shares a geo-tagged (Mandir Setu logo overlaid) photo.
// The actual image file should first be uploaded via POST /api/upload to obtain `imageUrl`.
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const { imageUrl, latitude, longitude } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required (upload the photo first via /api/upload).' }, { status: 400 })
    }

    const lat = latitude !== undefined && latitude !== null ? Number(latitude) : null
    const lng = longitude !== undefined && longitude !== null ? Number(longitude) : null

    if ((lat !== null && (lat < -90 || lat > 90)) || (lng !== null && (lng < -180 || lng > 180))) {
      return NextResponse.json({ error: 'latitude/longitude out of range.' }, { status: 400 })
    }

    const tag = await prisma.geoTagPhoto.create({
      data: { userId: user.id, imageUrl, latitude: lat, longitude: lng }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/geotag?id=xxx — Admins can delete inappropriate customer geo-tagged photos
export async function DELETE(req: Request) {
  try {
    const user = await requireUser()

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.geoTagPhoto.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
