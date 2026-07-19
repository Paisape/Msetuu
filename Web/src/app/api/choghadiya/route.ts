import { NextResponse } from 'next/server'

import { AstrologyApiNotConfiguredError, getChoghadiyaTimings } from '@/libs/astrology'

// GET /api/choghadiya?date=YYYY-MM-DD&lat=&lon=&tz=
// Public endpoint powering the Choghadiya section on the landing page.
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
    const data = await getChoghadiyaTimings({ date, latitude, longitude, timezone })

    return NextResponse.json({ configured: true, date: date.toISOString().slice(0, 10), ...data })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json(
        {
          configured: false,
          message:
            'Choghadiya data requires a free API key from freeastrologyapi.com. Sign up at https://freeastrologyapi.com/signup and set ASTROLOGY_API_KEY in your .env file.'
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Unable to fetch Choghadiya data right now.' }, { status: 502 })
  }
}
