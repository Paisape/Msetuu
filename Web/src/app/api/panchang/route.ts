import { NextResponse } from 'next/server'

import {
  AstrologyApiNotConfiguredError,
  getSunriseSunset,
  getTithi,
  getNakshatra,
  getYoga,
  getKarana
} from '@/libs/astrology'

// GET /api/panchang?date=YYYY-MM-DD&lat=&lon=&tz=
// Public endpoint powering the Panchang section on the landing page.
// Backed by the free tier of freeastrologyapi.com — sign up and set ASTROLOGY_API_KEY in .env.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const dateParam = params.get('date')
  const date = dateParam ? new Date(dateParam) : new Date()

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'date must be a valid YYYY-MM-DD value.' }, { status: 400 })
  }

  const latitude = params.get('lat') ? Number(params.get('lat')) : undefined
  const longitude = params.get('lon') ? Number(params.get('lon')) : undefined
  const timezone = params.get('tz') ? Number(params.get('tz')) : undefined

  const input = { date, latitude, longitude, timezone }

  try {
    const [sun, tithi, nakshatra, yoga, karana] = await Promise.all([
      getSunriseSunset(input),
      getTithi(input),
      getNakshatra(input),
      getYoga(input),
      getKarana(input)
    ])

    return NextResponse.json({ configured: true, date: date.toISOString().slice(0, 10), sun, tithi, nakshatra, yoga, karana })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json(
        {
          configured: false,
          message:
            'Panchang data requires a free API key from freeastrologyapi.com. Sign up at https://freeastrologyapi.com/signup and set ASTROLOGY_API_KEY in your .env file.'
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Unable to fetch Panchang data right now.' }, { status: 502 })
  }
}
