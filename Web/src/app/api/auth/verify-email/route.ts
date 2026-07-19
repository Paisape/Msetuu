import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()

    if (typeof email !== 'string' || typeof otp !== 'string' || !email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or OTP' }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified' }, { status: 200 })
    }

    if (!user.verificationOtp || !user.verificationOtpExpires) {
      return NextResponse.json({ error: 'No verification pending' }, { status: 400 })
    }

    if (new Date() > user.verificationOtpExpires) {
      return NextResponse.json({ error: 'Verification code has expired. Please register again or request a new code.' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(otp, user.verificationOtp)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationOtp: null,
        verificationOtpExpires: null
      }
    })

    return NextResponse.json({ success: true, message: 'Email verified successfully' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Unable to verify email' }, { status: 500 })
  }
}
