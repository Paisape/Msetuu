import fs from 'fs/promises'

import path from 'path'

import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { findNearestTemple } from '@/libs/geotagPoints'
import { enforceRateLimit } from '@/libs/rateLimit'


import { project, BOUNDARY_PATH, STATES_CENTERS, getPathD } from '@/libs/indiaMapData'

// GET /api/geotag
//   ?public=1        — public, no auth. Approved tags only, for the India map — never exposes
//                       who submitted a tag, only the image/temple/coordinates/date.
//   ?all=1           — admin only. Every tag regardless of status, for the moderation queue.
//   ?map=1 (or format=svg) — returns the complete pre-rendered Bhagwa SVG map with pins embedded
//   (no params)      — the logged-in caller's own tags, any status.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wantsMap = searchParams.get('map') === '1' || searchParams.get('format') === 'svg'

    let pins: any[] = []

    // Check if user is logged in
    const user = await requireUser().catch(() => null)

    if (user) {
      const wantsAll = searchParams.get('all') === '1'

      pins = await prisma.geoTagPhoto.findMany({
        where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
        orderBy: { createdAt: 'desc' },
        ...(wantsAll && user.role === 'ADMIN' ? { include: { user: { select: { name: true, email: true } } } } : {})
      })
    } else {
      // If not logged in (guest), they see no pins at all for complete privacy
      pins = []
    }

    // If they want the JSON response
    if (!wantsMap) {
      return NextResponse.json(pins)
    }

    // If they want the complete pre-rendered Bhagwa SVG map
    let statePathsStr = ''

    try {
      const geoJsonPath = path.join(process.cwd(), 'public', 'maps', 'india-states.geojson')
      const geoJsonData = await fs.readFile(geoJsonPath, 'utf8')
      const geoJson = JSON.parse(geoJsonData)

      if (geoJson?.features) {
        statePathsStr = geoJson.features
          .map((feature: any) => {
            const d = getPathD(feature.geometry)

            
return `<path d="${d}" fill="rgba(255, 103, 31, 0.04)" stroke="#FF671F" stroke-width="0.5" opacity="0.35" stroke-linejoin="round" />`
          })
          .join('\n')
      }
    } catch (e) {
      console.error('Failed to load state boundaries in Geotag API:', e)
    }

    const stateLabelsStr = STATES_CENTERS.map(st => {
      const { x, y } = project(st.lat, st.lng)

      
return `
        <text
          x="${x}"
          y="${y}"
          text-anchor="middle"
          fill="#d35400"
          opacity="0.45"
          style="font-size: 7px; font-weight: 850; font-family: sans-serif; pointer-events: none;"
        >
          ${st.name}
        </text>
      `
    }).join('\n')

    const pinsStr = pins.map((pin: any) => {
      const lat = Number(pin.latitude)
      const lng = Number(pin.longitude)

      if (isNaN(lat) || isNaN(lng)) return ''

      const { x, y } = project(lat, lng)
      const labelText = pin.templeName || pin.suggestedTempleName || 'Temple'

      return `
        <g transform="translate(${x}, ${y})">
          <!-- Animated pulse halo (rendered statically in SVG file) -->
          <circle r="12" fill="#FF671F" opacity="0.2" />

          <!-- Mandir Icon -->
          <path d="M 0,-10 L 0,-18 L 6,-15 Z" fill="#FF3D00" />
          <path d="M 0,-10 L -8,-2 L 8,-2 Z" fill="#FF671F" stroke="#ffffff" stroke-width="0.8" />
          <rect x="-8" y="-2" width="16" height="9" fill="#FF671F" stroke="#ffffff" stroke-width="0.8" rx="1" />
          <path d="M -2.5,7 L -2.5,2.5 Q 0,0.5 2.5,2.5 L 2.5,7 Z" fill="#ffffff" />

          <!-- Temple Label with White Outline Halo -->
          <text
            y="17"
            text-anchor="middle"
            fill="#1e293b"
            style="font-size: 8px; font-weight: 800; font-family: sans-serif; text-shadow: 1px 1px 0px #ffffff, -1px -1px 0px #ffffff, 1px -1px 0px #ffffff, -1px 1px 0px #ffffff; pointer-events: none;"
          >
            ${labelText}
          </text>
        </g>
      `
    }).join('\n')

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 560" width="100%" height="100%">
  <!-- Background soft color fill -->
  <path d="${BOUNDARY_PATH}" fill="rgba(255, 103, 31, 0.08)" stroke="none" />

  <!-- State boundaries -->
  ${statePathsStr}

  <!-- Main outer border line -->
  <path d="${BOUNDARY_PATH}" fill="none" stroke="#FF671F" stroke-width="2.0" stroke-linejoin="round" />

  <!-- State Name Labels -->
  ${stateLabelsStr}

  <!-- Geotag Pins -->
  ${pinsStr}
</svg>
    `.trim()

    return new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
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
