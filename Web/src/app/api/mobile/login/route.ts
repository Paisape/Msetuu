import { NextResponse } from 'next/server'

import { encode } from 'next-auth/jwt'

import prisma from '@/libs/prisma'

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days, matches web session maxAge

/**
 * Mobile-only login endpoint.
 *
 * The web app authenticates via NextAuth's HttpOnly session cookie, which a React
 * Native client cannot reliably store/replay. This route performs the exact same
 * credential check as /api/login (proxied here to avoid duplicating validation
 * logic) and, on success, returns a signed NextAuth-compatible JWT that the mobile
 * app sends back as `Authorization: Bearer <token>`. src/libs/api-auth.ts decodes
 * this token with the same NEXTAUTH_SECRET, so every existing protected route works
 * unchanged for both web (cookie) and mobile (bearer token) callers.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, otp } = body as { email?: string; password?: string; otp?: string }

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

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

    const secret = process.env.NEXTAUTH_SECRET

    if (!secret) {
      return NextResponse.json({ error: 'Server auth is not configured.' }, { status: 500 })
    }

    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
      select: { id: true, name: true, email: true, role: true, image: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const token = await encode({
      secret,
      maxAge: MAX_AGE_SECONDS,
      token: {
        sub: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
        role: user.role
      }
    })

    return NextResponse.json({
      token,
      expiresIn: MAX_AGE_SECONDS,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }
}
