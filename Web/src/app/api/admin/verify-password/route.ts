import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'
import { enforceRateLimit } from '@/libs/rateLimit'

// POST /api/admin/verify-password — checks the caller's current admin password without changing
// anything, so the Admin Login Credentials panel can reveal the email/password edit fields only
// after the admin proves they are who they say they are (rather than showing an always-editable
// form). The real update (PATCH-equivalent) at /api/admin/update-credentials re-verifies the
// current password again server-side regardless — this endpoint only gates the UI.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 })
    }

    const rateLimited = enforceRateLimit(req, 'admin-verify-password', { limit: 10, windowMs: 10 * 60 * 1000, identifier: (session.user as any)?.id, skipIp: true })

    if (rateLimited) return rateLimited

    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    const userId = (session.user as any)?.id
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          { email: session.user?.email || '' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 })
  }
}
