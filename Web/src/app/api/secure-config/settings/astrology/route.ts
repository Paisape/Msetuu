import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

// GET /api/secure-config/settings/astrology — Panchang (freeastrologyapi.com) + Rashifal
// (astrologyapi.com) credentials, redacted. Requires the Config menu to be unlocked.
export async function GET() {
  try {
    await requireSecureConfigAccess()

    const settings = await getRedactedSettings('ASTROLOGY')

    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/secure-config/settings/astrology — saves astrology API credentials. Blank/unchanged
// (masked) fields are ignored, so re-saving without touching a secret never wipes it.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()

    await saveSettings('ASTROLOGY', body, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
