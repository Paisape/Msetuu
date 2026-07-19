import crypto from 'crypto'

import { cookies } from 'next/headers'

import { requireAdmin, ApiAuthError, type SessionUser } from '@/libs/api-auth'

// Short-lived, HMAC-signed cookie proving an admin unlocked the Config menu with the secondary
// password (or completed a rotation). Separate from the NextAuth session entirely — this menu
// holds live payment/email secrets, so it gets its own narrow-scoped, short-TTL credential on
// top of normal admin login.
const COOKIE_NAME = 'mset_secure_config'
const SESSION_TTL_SECONDS = 30 * 60 // 30 minutes

function getSecret(): string {
  // Reuses NEXTAUTH_SECRET rather than introducing a second secret to manage — it's already
  // required, already private, and never sent to the client.
  return process.env.NEXTAUTH_SECRET || 'insecure-fallback-secret-set-NEXTAUTH_SECRET'
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export async function issueSecureConfigSession(adminId: string): Promise<void> {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000
  const payload = `${adminId}.${exp}`
  const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`

  const store = await cookies()

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
}

export async function hasValidSecureConfigSession(adminId: string): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value

  if (!token) return false

  const [payloadB64, sig] = token.split('.')

  if (!payloadB64 || !sig) return false

  let payload: string

  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
  } catch {
    return false
  }

  // Constant-time comparison — a signature check is exactly the kind of thing that must not
  // leak timing information about how many leading bytes matched.
  const expectedSig = sign(payload)
  const sigBuf = Buffer.from(sig, 'utf8')
  const expectedBuf = Buffer.from(expectedSig, 'utf8')

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false
  }

  const [tokenAdminId, expStr] = payload.split('.')
  const exp = Number(expStr)

  if (tokenAdminId !== adminId) return false
  if (!Number.isFinite(exp) || Date.now() > exp) return false

  return true
}

export async function clearSecureConfigSession(): Promise<void> {
  const store = await cookies()

  store.delete(COOKIE_NAME)
}

// Every PG/Email/SMS settings route (read or write) must call this instead of requireAdmin() —
// being an admin is not enough on its own to read or change live payment/email secrets; the
// Config menu must also have been unlocked with the secondary password in this browser session.
export async function requireSecureConfigAccess(): Promise<SessionUser> {
  const user = await requireAdmin()
  const ok = await hasValidSecureConfigSession(user.id)

  if (!ok) {
    throw new ApiAuthError('Config menu session expired or not unlocked. Please re-enter the Config password.', 401)
  }

  return user
}
