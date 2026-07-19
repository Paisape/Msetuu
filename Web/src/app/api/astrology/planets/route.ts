import { NextResponse } from 'next/server'

import { getPlanets, getPlanetsExtended, AstrologyApiNotConfiguredError, DEFAULT_LOCATION } from '@/libs/astrology'

// GET /api/astrology/planets?date=&time=&lat=&lon=&tz=&extended=1
// Birth-chart planet positions, live from freeastrologyapi.com (same key as Panchang/Muhurat).
// `date`/`time` describe the birth date/time being looked up (defaults to right now if omitted,
// which is only useful for a "planets right now" style widget, not an actual birth chart).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const timeParam = searchParams.get('time') // "HH:mm"
  const extended = searchParams.get('extended') === '1'

  const date = dateParam ? new Date(dateParam) : new Date()

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'date must be a valid date value.' }, { status: 400 })
  }

  if (timeParam && /^\d{1,2}:\d{2}$/.test(timeParam)) {
    const [h, m] = timeParam.split(':').map(Number)

    date.setUTCHours(h, m, 0, 0)
  }

  const latitude = searchParams.get('lat') ? Number(searchParams.get('lat')) : DEFAULT_LOCATION.latitude
  const longitude = searchParams.get('lon') ? Number(searchParams.get('lon')) : DEFAULT_LOCATION.longitude
  const timezone = searchParams.get('tz') ? Number(searchParams.get('tz')) : DEFAULT_LOCATION.timezone

  try {
    const result = await (extended ? getPlanetsExtended : getPlanets)({ date, latitude, longitude, timezone })

    return NextResponse.json({ configured: true, planets: result })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json({ configured: false })
    }

    console.error('[astrology/planets] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Planet position data is temporarily unavailable.' })
  }
}
