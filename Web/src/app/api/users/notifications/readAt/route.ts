import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const notificationId = typeof body?.notification_id === 'string' ? body.notification_id.trim() : ''

    if (!notificationId) {
      return NextResponse.json({ error: 'notification_id is required.' }, { status: 400 })
    }

    const result = await prisma.userNotification.updateMany({
      where: {
        notificationId,
        userId: user.id
      },
      data: {
        readAt: new Date()
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
