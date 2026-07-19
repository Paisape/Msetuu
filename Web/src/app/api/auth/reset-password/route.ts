import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json()

    if (
      typeof email !== 'string' ||
      typeof otp !== 'string' ||
      typeof newPassword !== 'string' ||
      !email ||
      !otp ||
      !newPassword
    ) {
      return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or OTP' }, { status: 400 })
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return NextResponse.json({ error: 'No password reset pending' }, { status: 400 })
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(otp, user.resetPasswordOtp)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,

        // Also verify the email if they managed to reset their password
        emailVerified: user.emailVerified || new Date()
      }
    })

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}
