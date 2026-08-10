import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'
import { adminLoginOtpEmail } from '@/libs/emailTemplates'
import { logActivity } from '@/libs/activityLog'
import { enforceRateLimit } from '@/libs/rateLimit'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const rateLimited = enforceRateLimit(req, 'login-precheck', { limit: 10, windowMs: 10 * 60 * 1000, identifier: email })

    if (rateLimited) return rateLimited

    const loginInput = email.trim()
    const isEmail = loginInput.includes('@')

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: isEmail ? loginInput.toLowerCase() : undefined },
          { phone: loginInput }
        ]
      }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email/mobile or password.' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      await logActivity({
        userId: user?.id,
        email: user?.email,
        role: user?.role ?? 'USER',
        action: 'FAILED_LOGIN',
        details: 'Incorrect password attempt.',
      })
      return NextResponse.json({ error: 'Invalid email/mobile or password.' }, { status: 401 })
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: 'Please verify your email address before logging in.' }, { status: 403 })
    }

    if (user.role === 'ADMIN') {
      const { getSetting } = require('@/libs/appSettings')
      const otpSetting = await getSetting('SECURITY', 'ADMIN_LOGIN_OTP_ENABLED')
      const requireOtp = otpSetting === 'true'

      if (requireOtp) {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOtp = await bcrypt.hash(otp, 12)
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationOtp: hashedOtp,
            verificationOtpExpires: otpExpires
          }
        })

        // Send the email
        const { subject, html } = adminLoginOtpEmail({ otp })
        try {
          const emailResult = await sendEmail({ to: user.email!, subject, html })
          if (!emailResult.sent) {
            console.error('SMTP Email Error:', emailResult.reason)
            return NextResponse.json({ error: 'Failed to send OTP email. Please check SMTP configuration.' }, { status: 500 })
          }
        } catch (emailError: any) {
          console.error('SMTP Email Error:', emailError)
          return NextResponse.json({ error: 'Failed to send OTP email. Please check SMTP configuration.' }, { status: 500 })
        }

        await logActivity({
          userId: user.id,
          email: user.email,
          role: user.role,
          action: 'LOGIN_OTP_SENT',
          details: 'Admin login initiated, OTP verification code dispatched.',
        })

        return NextResponse.json({ requireOtp: true, email: user.email })
      }
    }

    return NextResponse.json({ requireOtp: false })
  } catch (err: any) {
    console.error('[login-precheck] Error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
