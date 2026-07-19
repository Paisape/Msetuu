import { NextResponse } from 'next/server'

import { getMahaDasas, getMahaDasasAntarDasas, AstrologyApiNotConfiguredError, DEFAULT_LOCATION } from '@/libs/astrology'

// GET /api/astrology/dasha?date=&time=&lat=&lon=&tz=&antar=1
// Vimshottari Dasha periods for a birth date/time, live from freeastrologyapi.com.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const timeParam = searchParams.get('time') // "HH:mm"
  const withAntar = searchParams.get('antar') === '1'

  if (!dateParam) {
    return NextResponse.json({ error: 'date is required (the birth date).' }, { status: 400 })
  }

  const date = new Date(dateParam)

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
    const result = await (withAntar ? getMahaDasasAntarDasas : getMahaDasas)({ date, latitude, longitude, timezone })

    return NextResponse.json({ configured: true, dasha: result })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json({ configured: false })
    }

    console.error('[astrology/dasha] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Dasha data is temporarily unavailable.' })
  }
}
