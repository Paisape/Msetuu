import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'
import { passwordResetOtpEmail } from '@/libs/emailTemplates'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (typeof email !== 'string' || !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    // To prevent email enumeration, we always return success even if the user doesn't exist.
    if (!user) {
      return NextResponse.json({ success: true, message: 'If the email exists, an OTP has been sent.' }, { status: 200 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: await bcrypt.hash(otp, 12),
        resetPasswordOtpExpires: otpExpires
      }
    })

    // Send the email (don't block the response)
    const { subject, html } = passwordResetOtpEmail({ customerName: user.name || 'Devotee', otp })

    sendEmail({ to: user.email!, subject, html }).catch(console.error)

    return NextResponse.json({ success: true, message: 'If the email exists, an OTP has been sent.' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Unable to process request' }, { status: 500 })
  }
}
