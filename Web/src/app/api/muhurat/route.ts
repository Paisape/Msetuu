import { NextResponse } from 'next/server'

import { AstrologyApiNotConfiguredError, getGoodBadTimes } from '@/libs/astrology'

// GET /api/muhurat?date=YYYY-MM-DD&lat=&lon=&tz=
// Public endpoint for auspicious/inauspicious timings: Abhijit Muhurat, Rahu Kalam, Yama Gandam,
// Gulika Kalam, Dur Muhurat, Varjyam — i.e. the "sub muhurat" calculators requested for the homepage.
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

  try {
    const data = await getGoodBadTimes({ date, latitude, longitude, timezone })

    return NextResponse.json({ configured: true, date: date.toISOString().slice(0, 10), ...data })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json(
        {
          configured: false,
          message:
            'Muhurat data requires a free API key from freeastrologyapi.com. Sign up at https://freeastrologyapi.com/signup and set ASTROLOGY_API_KEY in your .env file.'
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Unable to fetch Muhurat data right now.' }, { status: 502 })
  }
}
