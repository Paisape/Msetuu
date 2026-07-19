import { NextResponse } from 'next/server'

import { getNumerologyProfile } from '@/libs/numerology'

const MAX_NAME_LENGTH = 200

// GET /api/numerology?name=&dob=YYYY-MM-DD
// Computed entirely locally (see src/libs/numerology.ts) — no external API, no key, no rate
// limit. Public endpoint, display-only reference data.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim().slice(0, MAX_NAME_LENGTH)
  const dobParam = searchParams.get('dob')

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 })
  }

  if (!dobParam) {
    return NextResponse.json({ error: 'dob (YYYY-MM-DD) is required.' }, { status: 400 })
  }

  const dob = new Date(dobParam)

  if (Number.isNaN(dob.getTime())) {
    return NextResponse.json({ error: 'dob must be a valid date value.' }, { status: 400 })
  }

  const profile = getNumerologyProfile(name, dob)

  return NextResponse.json({ configured: true, name, dob: dobParam, ...profile })
}
