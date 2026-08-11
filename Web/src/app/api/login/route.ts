// Next Imports
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { logActivity } from '@/libs/activityLog'
import { enforceRateLimit } from '@/libs/rateLimit'

export async function POST(req: Request) {
  try {
    const { email, password, otp, deviceId, deviceName, os } = await req.json()

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json(
        { message: ['Email or Password is invalid'] },
        { status: 401, statusText: 'Unauthorized Access' }
      )
    }

    // This route is also called server-to-server (NextAuth's authorize() and
    // /api/mobile/login both proxy through it without forwarding the real caller's IP), so
    // IP-based limiting is skipped here — the per-account identifier bucket is enough to stop
    // credential-stuffing against one target, and the real edge endpoints (login-precheck,
    // mobile/login) already apply IP-based limiting too.
    const rateLimited = enforceRateLimit(req, 'login', { limit: 10, windowMs: 10 * 60 * 1000, identifier: email, skipIp: true })

    if (rateLimited) return rateLimited

    const loginInput = email.trim()
    const isEmail = loginInput.includes('@')

    let normalizedPhone = undefined
    if (!isEmail) {
      const cleanPhone = loginInput.replace(/\s+/g, '')
      normalizedPhone = /^\d{10}$/.test(cleanPhone) ? `+91${cleanPhone}` : cleanPhone
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: isEmail ? loginInput.toLowerCase() : undefined },
          { phone: normalizedPhone }
        ]
      }
    })

    // User may not exist, or may have registered via Google OAuth (no password set)
    if (!user || !user.password) {
      return NextResponse.json(
        { message: ['Email/Mobile or Password is invalid'] },
        { status: 401, statusText: 'Unauthorized Access' }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { message: ['Email/Mobile or Password is invalid'] },
        { status: 401, statusText: 'Unauthorized Access' }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { message: ['Please verify your email address before logging in.'] },
        { status: 403, statusText: 'Email Not Verified' }
      )
    }

    // Admin requires OTP verification
    if (user.role === 'ADMIN') {
      const { getSetting } = require('@/libs/appSettings')
      const otpSetting = await getSetting('SECURITY', 'ADMIN_LOGIN_OTP_ENABLED')
      const requireOtp = otpSetting === 'true'

      if (requireOtp) {
        if (!otp) {
          return NextResponse.json(
            { message: ['Admin login verification code required.'] },
            { status: 401, statusText: 'Unauthorized Access' }
          )
        }

        if (!user.verificationOtp || !user.verificationOtpExpires) {
          return NextResponse.json(
            { message: ['Verification session expired. Please request a new code.'] },
            { status: 401, statusText: 'Unauthorized Access' }
          )
        }

        if (new Date() > user.verificationOtpExpires) {
          return NextResponse.json(
            { message: ['Verification code expired. Please request a new code.'] },
            { status: 401, statusText: 'Unauthorized Access' }
          )
        }

        const isOtpValid = await bcrypt.compare(otp, user.verificationOtp)

        if (!isOtpValid) {
          await logActivity({
            userId: user.id,
            email: user.email,
            role: user.role,
            action: 'FAILED_ADMIN_LOGIN_OTP',
            details: 'Incorrect OTP submitted for admin login verification.'
          })
          return NextResponse.json(
            { message: ['Invalid verification code.'] },
            { status: 401, statusText: 'Unauthorized Access' }
          )
        }

        // Clear code on success
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationOtp: null,
            verificationOtpExpires: null
          }
        })
      }
    }

    // Successful login telemetry log
    await logActivity({
      userId: user.id,
      email: user.email,
      role: user.role,
      action: 'LOGIN',
      details: `Successful login session initialized. Role: ${user.role}`
    })

    // Generate mobile tokens
    const {
      generateAccessToken,
      generateRefreshToken,
      hashRefreshToken,
      ACCESS_TOKEN_MAX_AGE_SECONDS,
      REFRESH_TOKEN_MAX_AGE_SECONDS
    } = require('@/libs/mobileAuth')

    const tokenEmail = user.email || `${loginInput}@phone.local`
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
      message: 'Logged in successfully.',
      isNewUser: false,
      accessToken,
      expiresIn: ACCESS_TOKEN_MAX_AGE_SECONDS,
      refreshToken,
      refreshExpiresIn: REFRESH_TOKEN_MAX_AGE_SECONDS,
      // Root level fields for backward compatibility (NextAuth & /api/mobile/login)
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      // Nested user object for mobile app developer
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        referralCode: user.referralCode,
        referralWalletBalance: user.referralWalletBalance
      }
    })
  } catch {
    return NextResponse.json(
      { message: ['Email/Mobile or Password is invalid'] },
      { status: 401, statusText: 'Unauthorized Access' }
    )
  }
}
