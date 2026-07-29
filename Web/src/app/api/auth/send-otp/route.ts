import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { enforceRateLimit } from '@/libs/rateLimit'
import { sendEmail } from '@/libs/email'
import { welcomeVerificationEmail } from '@/libs/emailTemplates'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const contact = typeof body.contact === 'string' ? body.contact.trim().toLowerCase() : ''
    const type = typeof body.type === 'string' && body.type.toUpperCase() === 'SMS' ? 'SMS' : 'EMAIL'

    if (!contact) {
      return NextResponse.json({ error: 'Contact (email or phone) is required.' }, { status: 400 })
    }

    if (type === 'EMAIL') {
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!EMAIL_REGEX.test(contact)) {
        return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
      }
    }

    // Rate limit: Max 5 requests per 15 minutes per contact
    const rateLimited = enforceRateLimit(req, 'send-otp', { limit: 5, windowMs: 15 * 60 * 1000, identifier: contact })
    if (rateLimited) return rateLimited

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 12)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing unused OTPs for this contact to prevent clutter
    await prisma.otpRequest.deleteMany({
      where: { contact }
    })

    await prisma.otpRequest.create({
      data: {
        contact,
        type,
        otpHash,
        expiresAt
      }
    })

    if (type === 'EMAIL') {
      // Send Email OTP using the existing welcome verification template
      // If we don't know the name, default to "User"
      const user = await prisma.user.findUnique({ where: { email: contact } })
      const { subject, html } = welcomeVerificationEmail({ customerName: user?.name || 'User', otp })

      sendEmail({ to: contact, subject, html }).catch(console.error)
      
      return NextResponse.json({ success: true, message: 'OTP sent to email successfully.' }, { status: 200 })
    } else {
      // SMS Flow (Simulated for now until SMS integration)
      console.log(`[SIMULATED SMS] Sending OTP ${otp} to phone number ${contact}`)
      
      return NextResponse.json({ success: true, message: 'OTP sent via SMS successfully (Simulated).' }, { status: 200 })
    }
  } catch (err: any) {
    console.error('Error sending OTP:', err)
    return NextResponse.json({ error: 'Unable to send OTP. Please try again.' }, { status: 500 })
  }
}
