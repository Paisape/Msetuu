import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdminApi } from '@/libs/api-auth'

export async function GET() {
  try {
    await requireAdminApi()

    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json(logs)
  } catch (err: any) {
    console.error('[api/notifications/history] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch notification logs.' }, { status: 500 })
  }
}
