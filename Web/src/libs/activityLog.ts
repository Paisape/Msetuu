import { headers } from 'next/headers'
import prisma from './prisma'

export async function logActivity(opts: {
  userId?: string | null
  email?: string | null
  role?: string | null
  action: string
  details?: string | Record<string, any> | null
}) {
  try {
    const headersList = await headers()

    // Telemetry capture
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      null

    const userAgent = headersList.get('user-agent') || null

    const detailsStr = typeof opts.details === 'object' && opts.details !== null
      ? JSON.stringify(opts.details)
      : opts.details || null

    await prisma.activityLog.create({
      data: {
        userId: opts.userId || null,
        email: opts.email || null,
        role: opts.role || null,
        action: opts.action,
        details: detailsStr,
        ipAddress,
        userAgent
      }
    })
  } catch (err) {
    console.error('[activity-log] Failed to log activity:', err)
  }
}
