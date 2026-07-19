// Best-effort IP/device capture for order "telemetry", shown only to admins.
// Behind a proxy (Vercel, nginx, etc.) the real client IP is forwarded via x-forwarded-for.
export function getRequestInfo(req: Request): { ip: string | null; userAgent: string | null } {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent')

  return { ip, userAgent }
}
