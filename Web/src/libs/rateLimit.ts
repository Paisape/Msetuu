import { NextResponse } from 'next/server'

// Lightweight in-memory sliding-window rate limiter. No external dependency (Redis/Upstash)
// is configured for this project, and the app runs as a single long-lived Node process per
// container (see Dockerfile/entrypoint.sh), so an in-memory Map is sufficient and avoids
// adding infrastructure. Caveat: if this is ever scaled to multiple container replicas behind
// a load balancer, each replica tracks its own counts — attackers could get roughly
// (limit × replica count) attempts instead of `limit`. Migrate to a shared store (e.g. Redis)
// if/when horizontal scaling is introduced.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodic sweep so the Map doesn't grow unbounded from one-off/expired keys.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanupTimer() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()

    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, CLEANUP_INTERVAL_MS)

  // Don't let this timer keep the process alive on its own.
  cleanupTimer.unref?.()
}

/** Returns the caller's IP from standard proxy headers, or 'unknown' if unavailable. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')

  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Increments the counter for `key` within a fixed window and reports whether the caller is
 * still under `limit`. Fixed-window (not true sliding-window) for simplicity — precise enough
 * for abuse prevention on auth endpoints.
 */
function hit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
  ensureCleanupTimer()

  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })

    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  bucket.count += 1

  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Enforces a rate limit keyed by IP, and optionally also by a caller-supplied identifier
 * (e.g. the email/account being targeted) so a distributed attack across many IPs against one
 * account is still caught. Returns a ready-to-return 429 NextResponse if the limit was
 * exceeded, or null if the caller may proceed.
 */
export function enforceRateLimit(
  req: Request,
  routeKey: string,
  opts: { limit: number; windowMs: number; identifier?: string | null; skipIp?: boolean }
): NextResponse | null {
  // Some routes (e.g. /api/login) are called both directly over the internet AND
  // server-to-server as an internal proxy target (NextAuth's authorize() and
  // /api/mobile/login both `fetch()` it without forwarding the original caller's IP). For
  // those, IP-based limiting would bucket all such internal calls under one shared "unknown"
  // key and could rate-limit unrelated users off each other — so skipIp lets a route rely on
  // the per-account identifier bucket only, while routes hit directly by real clients (the
  // login-precheck/mobile-login/register/etc. endpoints actually exposed to the internet)
  // should still pass skipIp: false (the default) to also catch distributed attacks.
  if (!opts.skipIp) {
    const ip = getClientIp(req)
    const ipResult = hit(`${routeKey}:ip:${ip}`, opts.limit, opts.windowMs)

    if (!ipResult.allowed) return tooManyRequests(ipResult.retryAfterSeconds)
  }

  if (opts.identifier) {
    const idResult = hit(`${routeKey}:id:${opts.identifier.trim().toLowerCase()}`, opts.limit, opts.windowMs)

    if (!idResult.allowed) return tooManyRequests(idResult.retryAfterSeconds)
  }

  return null
}

function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}
