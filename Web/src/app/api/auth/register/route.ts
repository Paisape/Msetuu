import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'
import { welcomeVerificationEmail } from '@/libs/emailTemplates'
import { logActivity } from '@/libs/activityLog'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined

    if (!name || name.length > 100) {
      return NextResponse.json({ error: 'Please provide a valid name.' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'USER',
        verificationOtp: await bcrypt.hash(otp, 12),
        verificationOtpExpires: otpExpires
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    // Send the email (don't block the response)
    const { subject, html } = welcomeVerificationEmail({ customerName: name, otp })

    sendEmail({ to: email, subject, html }).catch(console.error)

    await logActivity({
      userId: user.id,
      email: user.email,
      role: user.role,
      action: 'REGISTER',
      details: 'New user account created successfully.'
    })

    return NextResponse.json({ user, requireVerification: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Unable to register. Please try again.' }, { status: 500 })
  }
}
