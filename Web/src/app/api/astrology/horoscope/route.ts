import { NextResponse } from 'next/server'

import { getHoroscope, isHoroscopeApiConfigured, ZODIAC_SIGNS, type ZodiacSign, type HoroscopePeriod } from '@/libs/horoscopeApi'

// GET /api/astrology/horoscope?sign=aries&period=daily — live Rashifal prediction text from
// AstrologyAPI.com. Public (no auth), same as any horoscope widget. Never throws a 500 for "not
// configured yet" — returns { configured: false } so the frontend keeps its static placeholder
// text until an admin adds credentials under Config > Astrology.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const signParam = (searchParams.get('sign') || '').toLowerCase()
  const periodParam = (searchParams.get('period') || 'daily').toLowerCase()

  if (!ZODIAC_SIGNS.includes(signParam as ZodiacSign)) {
    return NextResponse.json({ error: `sign must be one of: ${ZODIAC_SIGNS.join(', ')}` }, { status: 400 })
  }

  const period: HoroscopePeriod = periodParam === 'monthly' ? 'monthly' : periodParam === 'tomorrow' ? 'tomorrow' : 'daily'

  if (!(await isHoroscopeApiConfigured())) {
    return NextResponse.json({ configured: false })
  }

  try {
    const { prediction } = await getHoroscope(signParam as ZodiacSign, period)

    return NextResponse.json({ configured: true, sign: signParam, period, prediction })
  } catch (err) {
    console.error('[astrology/horoscope] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Horoscope data is temporarily unavailable.' })
  }
}
