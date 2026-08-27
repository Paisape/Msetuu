import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

export async function GET() {
  try {
    const user = await requireUser()

    const items = await prisma.userNotification.findMany({
      where: { userId: user.id },
      orderBy: [
        { createdAt: 'desc' },
        { notificationId: 'desc' }
      ],
      select: {
        notificationId: true,
        title: true,
        message: true,
        actionUrl: true,
        channels: true,
        sentById: true,
        readAt: true,
        sourceType: true,
        sourceId: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      items: items.map((item: any) => ({
        notification_id: item.notificationId,
        title: item.title,
        message: item.message,
        actionUrl: item.actionUrl,
        channels: item.channels,
        sentById: item.sentById,
        readAt: item.readAt,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        createdAt: item.createdAt
      }))
    })
  } catch (err) {
    return handleApiError(err)
  }
}
