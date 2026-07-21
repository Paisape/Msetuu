import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/libs/api-auth'
import { dispatchNotificationBroadcast } from '@/libs/notificationSystem'

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdminApi()
    const body = await req.json()

    const { title, message, actionUrl, targetAudience, targetEmail, channels } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 })
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ error: 'Please select at least one notification channel (Email, SMS, WhatsApp, or Firebase).' }, { status: 400 })
    }

    const result = await dispatchNotificationBroadcast({
      title: title.trim(),
      message: message.trim(),
      actionUrl: actionUrl ? actionUrl.trim() : undefined,
      targetAudience: targetAudience || 'ALL',
      targetEmail: targetEmail ? targetEmail.trim() : undefined,
      channels,
      sentById: adminUser.id
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[api/notifications/send] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to dispatch notifications.' }, { status: 500 })
  }
}
