import { NextResponse } from 'next/server'

import { getAshtakootScore, AstrologyApiNotConfiguredError, DEFAULT_LOCATION } from '@/libs/astrology'

type BirthInput = { date: string; time?: string; lat?: number; lon?: number; tz?: number }

function parseBirthInput(raw: BirthInput | undefined, label: string): { date: Date; latitude: number; longitude: number; timezone: number } {
  if (!raw?.date) throw new Error(`${label}.date is required.`)

  const date = new Date(raw.date)

  if (Number.isNaN(date.getTime())) throw new Error(`${label}.date must be a valid date value.`)

  if (raw.time && /^\d{1,2}:\d{2}$/.test(raw.time)) {
    const [h, m] = raw.time.split(':').map(Number)

    date.setUTCHours(h, m, 0, 0)
  }

  return {
    date,
    latitude: raw.lat ?? DEFAULT_LOCATION.latitude,
    longitude: raw.lon ?? DEFAULT_LOCATION.longitude,
    timezone: raw.tz ?? DEFAULT_LOCATION.timezone
  }
}

// POST /api/astrology/match-making — body: { boy: {date, time?, lat?, lon?, tz?}, girl: {...} }
// Kundli matching (Ashtakoot score) for two birth details, live from freeastrologyapi.com.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  let boy: ReturnType<typeof parseBirthInput>
  let girl: ReturnType<typeof parseBirthInput>

  try {
    boy = parseBirthInput(body.boy, 'boy')
    girl = parseBirthInput(body.girl, 'girl')
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid input.' }, { status: 400 })
  }

  try {
    const result = await getAshtakootScore({ boy, girl })

    return NextResponse.json({ configured: true, matchMaking: result })
  } catch (err) {
    if (err instanceof AstrologyApiNotConfiguredError) {
      return NextResponse.json({ configured: false })
    }

    console.error('[astrology/match-making] Upstream request failed:', err)

    return NextResponse.json({ configured: false, error: 'Match making data is temporarily unavailable.' })
  }
}
