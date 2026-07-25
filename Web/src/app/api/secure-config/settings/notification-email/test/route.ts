import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { sendTestEmail } from '@/libs/mailer'

// POST /api/secure-config/settings/notification-email/test — sends a real test email using the
// notification SMTP config (falls back to the main Email SMTP if not yet configured), so the
// admin can confirm credentials work without waiting for a real notification event.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json().catch(() => ({}))
    const to = typeof body.to === 'string' && body.to.trim() ? body.to.trim() : user.email

    if (!to) {
      return NextResponse.json({ error: 'No recipient email address available.' }, { status: 400 })
    }

    const result = await sendTestEmail(to, 'NOTIFICATION_EMAIL')

    if (!result.sent) {
      return NextResponse.json({ error: result.reason }, { status: 502 })
    }

    return NextResponse.json({ success: true, sentTo: to })
  } catch (err) {
    return handleApiError(err)
  }
}
