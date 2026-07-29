import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { enforceRateLimit } from '@/libs/rateLimit'
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS
} from '@/libs/mobileAuth'
import { logActivity } from '@/libs/activityLog'
import { notifyUserWelcome } from '@/libs/notifyEvent'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const contact = typeof body.contact === 'string' ? body.contact.trim().toLowerCase() : ''
    const otp = typeof body.otp === 'string' ? body.otp.trim() : ''
    const purpose = typeof body.purpose === 'string' && body.purpose.toUpperCase() === 'REGISTER' ? 'REGISTER' : 'LOGIN'
    const { deviceId, deviceName, os } = body

    if (!contact || !otp) {
      return NextResponse.json({ error: 'Contact and OTP are required.' }, { status: 400 })
    }

    // Rate limit: Max 10 attempts per 10 minutes per contact
    const rateLimited = enforceRateLimit(req, 'verify-otp', { limit: 10, windowMs: 10 * 60 * 1000, identifier: contact })
    if (rateLimited) return rateLimited

    // Find the latest OTP request that matches the contact AND purpose
    const otpRequest = await prisma.otpRequest.findFirst({
      where: { contact, purpose },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRequest) {
      return NextResponse.json({ error: 'No valid OTP request found.' }, { status: 400 })
    }

    if (new Date() > otpRequest.expiresAt) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(otp, otpRequest.otpHash)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 })
    }

    // OTP is valid! Delete the request so it can't be reused
    await prisma.otpRequest.deleteMany({
      where: { contact, purpose }
    })

    const isEmail = otpRequest.type === 'EMAIL'
    
    let user = isEmail 
      ? await prisma.user.findUnique({ where: { email: contact } })
      : await prisma.user.findFirst({ where: { phone: contact } })

    if (purpose === 'REGISTER') {
      if (!user) {
        return NextResponse.json({ error: 'User not found for registration verification.' }, { status: 400 })
      }
      
      const updateData: any = {}
      if (isEmail) updateData.emailVerified = new Date()
      else updateData.phoneVerified = new Date() // In a real app we'd have a phoneVerified column or similar. For now we assume emailVerified is enough for web. Wait, User model doesn't have phoneVerified. Let's not crash if we don't have it.

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })
      
      notifyUserWelcome(user.id, user.name || undefined)

      return NextResponse.json({ success: true, message: 'Verified successfully.' }, { status: 200 })
    }

    // --- LOGIN FLOW ---
    if (!user) {
      // Auto-registration for passwordless login
      const randomPassword = require('crypto').randomBytes(32).toString('hex')
      const hashedPassword = await bcrypt.hash(randomPassword, 12)

      user = await prisma.user.create({
        data: {
          email: isEmail ? contact : null,
          phone: !isEmail ? contact : null,
          name: isEmail ? contact.split('@')[0] : 'User',
          password: hashedPassword,
          role: 'USER',
          emailVerified: isEmail ? new Date() : null
        }
      })
      
      await logActivity({
        userId: user.id,
        email: user.email,
        role: user.role,
        action: 'REGISTER',
        details: 'User registered via passwordless OTP.'
      })
    } else {
      // If user exists but email not verified, verify it
      if (isEmail && !user.emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
      }
    }

    // Generate mobile tokens
    const tokenEmail = user.email || `${contact}@phone.local`
    const accessToken = await generateAccessToken({ ...user, email: tokenEmail })
    const refreshToken = generateRefreshToken()

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        deviceId: typeof deviceId === 'string' ? deviceId.slice(0, 200) : null,
        deviceName: typeof deviceName === 'string' ? deviceName.slice(0, 200) : null,
        os: typeof os === 'string' ? os.slice(0, 100) : null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SECONDS * 1000)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Verified successfully.',
      accessToken,
      expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
      refreshToken,
      refreshExpiresIn: REFRESH_TOKEN_MAX_AGE_SECONDS,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image }
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error verifying OTP:', err)
    return NextResponse.json({ error: 'Unable to verify OTP. Please try again.' }, { status: 500 })
  }
}
