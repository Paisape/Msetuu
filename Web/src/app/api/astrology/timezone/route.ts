import { NextResponse } from 'next/server'

import { getTimezoneWithDst, AstrologyApiNotConfiguredError, DEFAULT_LOCATION } from '@/libs/astrology'

// GET /api/astrology/timezone?lat=&lon=&date=
// Timezone (with DST) for a coordinate — covers the same need as a dedicated TimeZoneDB
// integration, using the already-configured freeastrologyapi.com key instead of a separate
// signup.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const date = dateParam ? new Date(dateParam) : new Date()

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'date must be a valid date value.' }, { status: 400 })
  }

  const latitude = searchParams.get('lat') ? Number(searchParams.get('lat')) : DEFAULT_LOCATION.latitude
  const longitude = searchParams.get('lon') ? Number(searchParams.get('lon')) : DEFAULT_LOCATION.longitude

  try {
    const result = await getTimezoneWithDst({ latitude, longitude, date })

    return NextResponse.json({ configured: true, timezone: result })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json({ configured: false })
    }

    console.error('[astrology/timezone] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Timezone lookup is temporarily unavailable.' })
  }
}
