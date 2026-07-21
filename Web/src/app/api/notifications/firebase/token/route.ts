import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { fcmToken, email } = body

    if (!fcmToken) {
      return NextResponse.json({ error: 'fcmToken is required.' }, { status: 400 })
    }

    const userEmail = session?.user?.email || email

    if (userEmail) {
      await prisma.user.updateMany({
        where: { email: userEmail.trim().toLowerCase() },
        data: { fcmToken }
      })
    }

    return NextResponse.json({ success: true, message: 'FCM Token registered successfully.' })
  } catch (err: any) {
    console.error('[api/notifications/firebase/token] Error:', err)
    return NextResponse.json({ error: 'Failed to register FCM token.' }, { status: 500 })
  }
}
