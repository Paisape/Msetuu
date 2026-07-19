import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

// GET /api/secure-config/settings/pg — Razorpay key id/secret, redacted. Requires the Config
// menu to be unlocked (secondary password), not just ADMIN login.
export async function GET() {
  try {
    await requireSecureConfigAccess()

    const settings = await getRedactedSettings('PG')

    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/secure-config/settings/pg — saves Razorpay key id/secret. Blank/unchanged (masked)
// fields are ignored, so re-saving without touching the secret never wipes it.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()

    await saveSettings('PG', body, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
