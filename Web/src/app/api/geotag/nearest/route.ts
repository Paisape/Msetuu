import { NextResponse } from 'next/server'

import { findNearestTemple, getPointsPerTag } from '@/libs/geotagPoints'

// GET /api/geotag/nearest?lat=&lng= — public. Called right after the visitor's selfie captures
// GPS coordinates, so the app can say "Looks like you're at <temple>" before they submit —
// they can still overwrite it if it's wrong or no temple matched.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Valid lat and lng query params are required.' }, { status: 400 })
    }

    const [nearest, pointsPerTag] = await Promise.all([findNearestTemple(lat, lng), getPointsPerTag()])

    return NextResponse.json({ temple: nearest, pointsPerTag })
  } catch {
    return NextResponse.json({ temple: null, pointsPerTag: 0 })
  }
}
