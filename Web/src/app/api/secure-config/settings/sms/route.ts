import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

// GET /api/secure-config/settings/sms — SMS provider config, redacted. No provider is actually
// wired up yet (per product decision) — this only persists the settings for when one is added.
export async function GET() {
  try {
    await requireSecureConfigAccess()

    const settings = await getRedactedSettings('SMS')

    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/secure-config/settings/sms — saves SMS provider config. Blank/unchanged (masked)
// fields are ignored, so re-saving without touching a secret never wipes it.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()

    await saveSettings('SMS', body, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
