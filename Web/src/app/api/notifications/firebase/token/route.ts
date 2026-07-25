import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

export async function POST(req: Request) {
  try {
    // Always resolve the caller from their verified session/bearer token — never from a
    // client-supplied `email` field, which would let anyone overwrite another user's push
    // token (and hijack delivery of that account's notifications) just by knowing their email.
    const user = await requireUser()
    const body = await req.json()
    const { fcmToken } = body

    if (typeof fcmToken !== 'string' || !fcmToken) {
      return NextResponse.json({ error: 'fcmToken is required.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken }
    })

    return NextResponse.json({ success: true, message: 'FCM Token registered successfully.' })
  } catch (err: any) {
    return handleApiError(err)
  }
}
