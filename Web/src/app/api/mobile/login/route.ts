import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { enforceRateLimit } from '@/libs/rateLimit'
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS
} from '@/libs/mobileAuth'

/**
 * Mobile-only login endpoint.
 *
 * The web app authenticates via NextAuth's HttpOnly session cookie, which a React Native
 * client cannot reliably store/replay. This route performs the exact same credential check as
 * /api/login (proxied here to avoid duplicating validation logic) and, on success, issues:
 *
 * - `accessToken` — a short-lived (30 min) signed JWT sent as `Authorization: Bearer <token>`
 *   on every subsequent request. src/libs/api-auth.ts decodes it with the same
 *   NEXTAUTH_SECRET, so every existing protected route works unchanged for both web (cookie)
 *   and mobile (bearer token) callers.
 * - `refreshToken` — a long-lived (60 day), device-bound opaque token. Exchange it for a new
 *   accessToken via POST /api/mobile/refresh before the current one expires. It is rotated
 *   (replaced) on every refresh and can be revoked via POST /api/mobile/logout, or all at once
 *   via POST /api/mobile/logout-all.
 *
 * Optional `deviceId`/`deviceName`/`os` in the request body let the user later see and manage
 * their logged-in devices via GET /api/mobile/sessions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, otp, deviceId, deviceName, os } = body as {
      email?: string
      password?: string
      otp?: string
      deviceId?: string
      deviceName?: string
      os?: string
    }

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const rateLimited = enforceRateLimit(req, 'mobile-login', { limit: 10, windowMs: 10 * 60 * 1000, identifier: email })

    if (rateLimited) return rateLimited

    const origin = new URL(req.url).origin

    const loginRes = await fetch(`${origin}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, otp })
    })

    const loginData = await loginRes.json().catch(() => null)

    if (!loginRes.ok || !loginData?.email) {
      const message = Array.isArray(loginData?.message) ? loginData.message[0] : 'Invalid email or password.'

      return NextResponse.json({ error: message }, { status: loginRes.status || 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
      select: { id: true, name: true, email: true, role: true, image: true }
    })

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const accessToken = await generateAccessToken({ ...user, email: user.email })
    const refreshToken = generateRefreshToken()

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        deviceId: typeof deviceId === 'string' ? deviceId.slice(0, 200) : null,
        deviceName: typeof deviceName === 'string' ? deviceName.slice(0, 200) : null,
        os: typeof os === 'string' ? os.slice(0, 100) : null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000)
      }
    })

    return NextResponse.json({
      accessToken,
      expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
      refreshToken,
      refreshExpiresIn: REFRESH_TOKEN_MAX_AGE_SECONDS,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }
}
