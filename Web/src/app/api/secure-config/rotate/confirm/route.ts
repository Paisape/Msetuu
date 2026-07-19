import { NextResponse } from 'next/server'

import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { confirmRotation } from '@/libs/secureConfigAuth'
import { issueSecureConfigSession } from '@/libs/secureConfigSession'

// POST /api/secure-config/rotate/confirm — verifies the emailed OTP, sets the new Config
// password, and unlocks the menu for this session in one step.
export async function POST(req: Request) {
  try {
    const user = await requireAdmin()

    const body = await req.json()
    const { otp, newPassword } = body

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'OTP is required.' }, { status: 400 })
    }

    await confirmRotation(otp, newPassword)
    await issueSecureConfigSession(user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Error && !('status' in err)) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    return handleApiError(err)
  }
}
