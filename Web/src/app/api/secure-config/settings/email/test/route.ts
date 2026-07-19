import { NextResponse } from 'next/server'

import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { sendTestEmail } from '@/libs/mailer'

// POST /api/secure-config/settings/email/test — sends a real test email using whatever SMTP
// config is currently saved (DB or env), so the admin can confirm credentials work without
// digging for a real trigger elsewhere in the app.
export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json().catch(() => ({}))
    const to = typeof body.to === 'string' && body.to.trim() ? body.to.trim() : user.email

    if (!to) {
      return NextResponse.json({ error: 'No recipient email address available.' }, { status: 400 })
    }

    const result = await sendTestEmail(to)

    if (!result.sent) {
      return NextResponse.json({ error: result.reason }, { status: 502 })
    }

    return NextResponse.json({ success: true, sentTo: to })
  } catch (err) {
    return handleApiError(err)
  }
}
