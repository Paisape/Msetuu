import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

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
