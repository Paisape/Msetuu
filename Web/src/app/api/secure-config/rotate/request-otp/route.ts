import { NextResponse } from 'next/server'

import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { requestRotationOtp } from '@/libs/secureConfigAuth'

// POST /api/secure-config/rotate/request-otp — sends a fresh OTP to the fixed recovery address
// so the mandatory 15-day password rotation can proceed. Requires ADMIN login (not the Config
// password itself, since the whole point is the old Config password may be stale/forgotten).
export async function POST() {
  try {
    await requireAdmin()
    await requestRotationOtp()

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
