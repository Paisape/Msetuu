import { NextResponse } from 'next/server'

import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getSecureConfigStatus } from '@/libs/secureConfigAuth'
import { hasValidSecureConfigSession } from '@/libs/secureConfigSession'

// GET /api/secure-config/status — whether the Config menu is currently unlocked for this admin,
// and whether the mandatory 15-day password rotation has kicked in.
export async function GET() {
  try {
    const user = await requireAdmin()
    const { rotationRequired, daysSinceChange } = await getSecureConfigStatus()
    const unlocked = await hasValidSecureConfigSession(user.id)

    return NextResponse.json({ unlocked, rotationRequired, daysSinceChange })
  } catch (err) {
    return handleApiError(err)
  }
}
