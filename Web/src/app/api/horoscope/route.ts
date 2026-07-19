import { NextResponse } from 'next/server'

// Free, keyless horoscope text API — https://freehoroscopeapi.com (no signup required).
// Vedic Rashi and Western zodiac signs cover the same 12 divisions under different names,
// so we map the Rashi selected on the homepage to its Western equivalent for this endpoint.
const HOROSCOPE_API_BASE = 'https://freehoroscopeapi.com/api/v1/get-horoscope'

const RASHI_TO_SIGN: Record<string, string> = {
  mesha: 'aries',
  vrishabha: 'taurus',
  mithuna: 'gemini',
  karka: 'cancer',
  simha: 'leo',
  kanya: 'virgo',
  tula: 'libra',
  vrishchika: 'scorpio',
  dhanu: 'sagittarius',
  makara: 'capricorn',
  kumbha: 'aquarius',
  meena: 'pisces'
}

// "today" and "tomorrow" both use the `daily` endpoint (the free API only exposes "today's"
// horoscope per sign — there's no distinct future-date lookup on the free tier).
const PERIOD_TO_ENDPOINT: Record<string, string> = {
  today: 'daily',
  tomorrow: 'daily',
  week: 'weekly',
  month: 'monthly'
}

// GET /api/horoscope?rashi=mesha&period=today|tomorrow|week|month
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const rashi = (params.get('rashi') ?? '').toLowerCase()
  const period = (params.get('period') ?? 'today').toLowerCase()

  const sign = RASHI_TO_SIGN[rashi]
  const endpoint = PERIOD_TO_ENDPOINT[period]

  if (!sign) {
    return NextResponse.json(
      { error: `rashi must be one of ${Object.keys(RASHI_TO_SIGN).join(', ')}` },
      { status: 400 }
    )
  }

  if (!endpoint) {
    return NextResponse.json({ error: 'period must be one of today, tomorrow, week, month' }, { status: 400 })
  }

  try {
    const res = await fetch(`${HOROSCOPE_API_BASE}/${endpoint}?sign=${sign}`, {
      next: { revalidate: 60 * 60 * 3 } // horoscope text refreshes a few times a day at most
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Horoscope provider is temporarily unavailable.' }, { status: 502 })
    }

    const json = await res.json()

    return NextResponse.json({ rashi, period, sign, ...json.data })
  } catch {
    return NextResponse.json({ error: 'Horoscope provider is temporarily unavailable.' }, { status: 502 })
  }
}
