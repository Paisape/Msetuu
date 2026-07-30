import { randomBytes, createHash } from 'node:crypto'

import { encode } from 'next-auth/jwt'

// Short-lived: if an access token is ever stolen (e.g. from an insecure app-side cache), it's
// only useful for a limited window before it stops working on its own.
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days (TEMPORARY FOR TESTING)

// Long-lived, but device-bound and revocable (see RefreshToken model) — this is what actually
// keeps the user signed in across app opens. Rotated on every use (see /api/mobile/refresh).
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 24 * 60 * 60 // 60 days

export type MobileTokenUser = {
  id: string
  name?: string | null
  email: string
  image?: string | null
  role: string
}

/** Mints a NextAuth-compatible signed JWT access token — verified the same way as the web session. */
export async function generateAccessToken(user: MobileTokenUser): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret) throw new Error('Server auth is not configured.')

  return encode({
    secret,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
      role: user.role
    }
  })
}

/** A cryptographically random opaque refresh token — deliberately NOT a JWT (nothing to decode, only to look up). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex')
}

/** Only this hash is ever persisted — a database leak alone can't be replayed as a live session. */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
