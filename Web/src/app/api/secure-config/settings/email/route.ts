import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

// GET /api/secure-config/settings/email — SMTP host/port/user/from, redacted password. Requires
// the Config menu to be unlocked.
export async function GET() {
  try {
    await requireSecureConfigAccess()

    const settings = await getRedactedSettings('EMAIL')

    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/secure-config/settings/email — saves SMTP config. Blank/unchanged (masked) fields
// are ignored, so re-saving without touching the password never wipes it.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()

    await saveSettings('EMAIL', body, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
