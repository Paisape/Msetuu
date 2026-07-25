import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

// GET /api/secure-config/settings/notification-email — SMTP account used only by the
// notification system (admin broadcasts + automatic new-listing/welcome/order-accepted/
// video-uploaded alerts), kept separate from Config > Email's main transactional SMTP. Requires
// the Config menu to be unlocked.
export async function GET() {
  try {
    await requireSecureConfigAccess()

    const settings = await getRedactedSettings('NOTIFICATION_EMAIL')

    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/secure-config/settings/notification-email — saves the notification SMTP config.
// Blank/unchanged (masked) fields are ignored, so re-saving without touching the password never
// wipes it. If left unset entirely, the notification system falls back to the main Email SMTP.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()

    await saveSettings('NOTIFICATION_EMAIL', body, user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
