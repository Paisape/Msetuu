import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { findNearestTemple } from '@/libs/geotagPoints'
import { enforceRateLimit } from '@/libs/rateLimit'

// GET /api/geotag
//   ?public=1        — public, no auth. Approved tags only, for the India map — never exposes
//                       who submitted a tag, only the image/temple/coordinates/date.
//   ?all=1           — admin only. Every tag regardless of status, for the moderation queue.
//   (no params)      — the logged-in caller's own tags, any status.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    if (searchParams.get('public') === '1') {
      const approved = await prisma.geoTagPhoto.findMany({
        where: { status: 'APPROVED', latitude: { not: null }, longitude: { not: null } },
        select: { id: true, imageUrl: true, templeName: true, latitude: true, longitude: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 500
      })

      return NextResponse.json(approved)
    }

    const user = await requireUser()
    const wantsAll = searchParams.get('all') === '1'

    const photos = await prisma.geoTagPhoto.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      ...(wantsAll && user.role === 'ADMIN' ? { include: { user: { select: { name: true, email: true } } } } : {})
    })

    return NextResponse.json(photos)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/geotag — logged-in user shares a geo-tagged temple selfie. The actual image file
// should first be uploaded via POST /api/upload to obtain `imageUrl`. Starts PENDING — no
// points are awarded until an admin approves it (see PATCH /api/geotag/[id]).
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const rateLimited = enforceRateLimit(req, 'geotag-submit', { limit: 20, windowMs: 60 * 60 * 1000, identifier: user.id, skipIp: true })

    if (rateLimited) return rateLimited

    const body = await req.json()
    const { imageUrl, latitude, longitude, templeName } = body

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required (upload the photo first via /api/upload).' }, { status: 400 })
    }

    const lat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null
    const lng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null

    if ((lat !== null && (lat < -90 || lat > 90)) || (lng !== null && (lng < -180 || lng > 180))) {
      return NextResponse.json({ error: 'latitude/longitude out of range.' }, { status: 400 })
    }

    // Re-derive the suggested temple server-side rather than trusting anything the client
    // claims was "detected" — the client only ever gets to submit the final, possibly
    // manually-corrected, templeName.
    const suggestion = lat !== null && lng !== null ? await findNearestTemple(lat, lng) : null

    const finalTempleName = typeof templeName === 'string' && templeName.trim() ? templeName.trim().slice(0, 150) : suggestion?.name || null

    if (!finalTempleName) {
      return NextResponse.json({ error: 'templeName is required — enter the temple name if it wasn\'t auto-detected.' }, { status: 400 })
    }

    const tag = await prisma.geoTagPhoto.create({
      data: {
        userId: user.id,
        imageUrl,
        latitude: lat,
        longitude: lng,
        templeName: finalTempleName,
        suggestedTempleName: suggestion?.name || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/geotag?id=xxx — admin removes an inappropriate/spam photo entirely (distinct from
// rejecting — rejection via PATCH keeps a record and is the normal moderation path; delete is
// for genuinely abusive content).
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

    await prisma.geoTagPhoto.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
