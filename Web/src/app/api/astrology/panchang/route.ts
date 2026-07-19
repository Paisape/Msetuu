import { NextResponse } from 'next/server'

import {
  getChoghadiyaTimings,
  getGoodBadTimes,
  getTithi,
  getNakshatra,
  getYoga,
  getKarana,
  getSunriseSunset,
  AstrologyApiNotConfiguredError,
  DEFAULT_LOCATION
} from '@/libs/astrology'

// GET /api/astrology/panchang?lat=..&lon=..&tz=.. — today's Panchang + Choghadiya, live from
// freeastrologyapi.com. Public (no auth) — this is display-only reference data, same as any
// panchang widget. Never throws a 500 for "not configured yet" — returns { configured: false }
// so the frontend can keep showing its static placeholder until an admin adds the key under
// Config > Astrology.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const latitude = searchParams.get('lat') ? Number(searchParams.get('lat')) : DEFAULT_LOCATION.latitude
  const longitude = searchParams.get('lon') ? Number(searchParams.get('lon')) : DEFAULT_LOCATION.longitude
  const timezone = searchParams.get('tz') ? Number(searchParams.get('tz')) : DEFAULT_LOCATION.timezone

  const input = { date: new Date(), latitude, longitude, timezone }

  try {
    const [choghadiya, goodBadTimes, tithi, nakshatra, yoga, karana, sunriseSunset] = await Promise.all([
      getChoghadiyaTimings(input),
      getGoodBadTimes(input),
      getTithi(input),
      getNakshatra(input),
      getYoga(input),
      getKarana(input),
      getSunriseSunset(input)
    ])

    return NextResponse.json({
      configured: true,

      // Raw upstream payloads — field names/shape are whatever freeastrologyapi.com returns for
      // each endpoint. Passed through as-is rather than reshaped, since the exact response schema
      // isn't guaranteed stable; the frontend renders defensively and falls back to static
      // reference text for anything it can't find a recognizable field for.
      choghadiya,
      goodBadTimes,
      tithi,
      nakshatra,
      yoga,
      karana,
      sunriseSunset
    })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json({ configured: false })
    }

    console.error('[astrology/panchang] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Panchang data is temporarily unavailable.' })
  }
}
