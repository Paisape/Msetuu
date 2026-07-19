import { NextResponse } from 'next/server'

import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getSecureConfigStatus, verifySecureConfigPassword } from '@/libs/secureConfigAuth'
import { issueSecureConfigSession } from '@/libs/secureConfigSession'

// POST /api/secure-config/unlock — day-to-day entry into the Config menu. Only the secondary
// password is required here; if the 15-day rotation is due, this deliberately refuses to unlock
// (even with the correct password) and tells the frontend to run the OTP rotation flow instead.
export async function POST(req: Request) {
  try {
    const user = await requireAdmin()

    const { rotationRequired } = await getSecureConfigStatus()

    if (rotationRequired) {
      return NextResponse.json({ error: 'Password rotation is required before the Config menu can be unlocked.', rotationRequired: true }, { status: 409 })
    }

    const body = await req.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    const isValid = await verifySecureConfigPassword(password)

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect Config password.' }, { status: 401 })
    }

    await issueSecureConfigSession(user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
