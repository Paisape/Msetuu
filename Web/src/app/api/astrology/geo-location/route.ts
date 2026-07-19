import { NextResponse } from 'next/server'

import { getGeoLocation, AstrologyApiNotConfiguredError } from '@/libs/astrology'

// GET /api/astrology/geo-location?place=Varanasi
// Birth-place lookup (lat/lon/timezone for a place name) — covers the same need as a dedicated
// GeoNames integration, using the already-configured freeastrologyapi.com key instead of a
// separate signup.
export async function GET(req: Request) {
  const place = new URL(req.url).searchParams.get('place')?.trim()

  if (!place) {
    return NextResponse.json({ error: 'place query parameter is required.' }, { status: 400 })
  }

  try {
    const result = await getGeoLocation(place)

    return NextResponse.json({ configured: true, location: result })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json({ configured: false })
    }

    console.error('[astrology/geo-location] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Location lookup is temporarily unavailable.' })
  }
}
