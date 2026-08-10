import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { logActivity } from '@/libs/activityLog'
import { enforceRateLimit } from '@/libs/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined

    const rateLimited = enforceRateLimit(req, 'register', { limit: 6, windowMs: 60 * 60 * 1000, identifier: email || undefined })

    if (rateLimited) return rateLimited

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
      if (existing.emailVerified !== null) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }

      // If the account exists but is unverified, allow updating/overwriting it to re-trigger verification
      const referralCodeInput = typeof body.referralCode === 'string' ? body.referralCode.trim() : ''
      const { generateUniqueReferralCode, validateReferrer } = await import('@/libs/referralEngine')
      
      const referredById = referralCodeInput ? await validateReferrer(referralCodeInput, email, phone) : null
      const uniqueReferralCode = existing.referralCode || await generateUniqueReferralCode()
      const hashedPassword = await bcrypt.hash(password, 12)

      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          phone,
          password: hashedPassword,
          referralCode: uniqueReferralCode,
          referredById
        },
        select: { id: true, name: true, email: true, phone: true, role: true, referralCode: true, createdAt: true }
      })

      await logActivity({
        userId: user.id,
        email: user.email,
        role: user.role,
        action: 'REGISTER',
        details: 'Unverified user account updated for re-registration.'
      })

      return NextResponse.json({ user, requireVerification: true }, { status: 201 })
    }

    const referralCodeInput = typeof body.referralCode === 'string' ? body.referralCode.trim() : ''
    const { generateUniqueReferralCode, validateReferrer } = await import('@/libs/referralEngine')
    
    const referredById = referralCodeInput ? await validateReferrer(referralCodeInput, email, phone) : null
    const uniqueReferralCode = await generateUniqueReferralCode()

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'USER',
        referralCode: uniqueReferralCode,
        referredById
      },
      select: { id: true, name: true, email: true, phone: true, role: true, referralCode: true, createdAt: true }
    })

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
