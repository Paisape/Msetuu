import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sendTextziSms } from '@/libs/sms'

// GET /api/admin/sms-templates/logs — Fetch SMS request/response logs
export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    const [logs, total] = await prisma.$transaction([
      prisma.smsLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.smsLog.count()
    ])

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/admin/sms-templates/logs — Resend SMS from an existing log entry
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { logId } = await req.json()

    if (!logId) {
      return NextResponse.json({ error: 'logId is required.' }, { status: 400 })
    }

    const log = await prisma.smsLog.findUnique({
      where: { id: logId }
    })

    if (!log) {
      return NextResponse.json({ error: 'Log entry not found.' }, { status: 404 })
    }

    // Modernize / sanitize message: convert legacy /v/ URLs to DLT approved /t/?id= URLs
    let sanitizedMessage = log.message
    if (sanitizedMessage.includes('/v/')) {
      sanitizedMessage = sanitizedMessage.replace(/\/v\/([^?&#\s\.]+)/g, '/t/?id=$1')
    }

    const result = await sendTextziSms(log.mobile, sanitizedMessage, log.templateId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message || 'Gateway rejected SMS dispatch.',
        response: result.response
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: `SMS successfully re-dispatched to ${log.mobile}!`,
      gatewayResponse: result.response
    })
  } catch (err) {
    return handleApiError(err)
  }
}

