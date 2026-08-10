import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

// GET /api/secure-config/settings/referral — loads referral settings, redacted
export async function GET() {
  try {
    await requireSecureConfigAccess()

    const settings = await getRedactedSettings('REFERRAL')

    const response = NextResponse.json(settings)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    return response
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/secure-config/settings/referral — saves referral settings
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()

    await saveSettings('REFERRAL', body, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
