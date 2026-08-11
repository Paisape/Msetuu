import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { enforceRateLimit } from '@/libs/rateLimit'
import { sendEmail } from '@/libs/email'
import { welcomeVerificationEmail, welcomePhoneVerificationEmail, passwordlessOtpEmail } from '@/libs/emailTemplates'
import { sendOtpSms } from '@/libs/sms'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const contact = typeof body.contact === 'string' ? body.contact.trim().toLowerCase() : ''
    const type = typeof body.type === 'string' && body.type.toUpperCase() === 'SMS' ? 'SMS' : 'EMAIL'
    const purpose = typeof body.purpose === 'string' && body.purpose.toUpperCase() === 'REGISTER' ? 'REGISTER' : 'LOGIN'

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

    // Generate 6-digit OTP (or fixed OTP for Google Play Store test account)
    const isTestAccount = contact === 'dev@mandirsetuu.com'
    const { randomInt } = require('crypto')
    const otp = isTestAccount ? '223344' : randomInt(100000, 1000000).toString()
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
        purpose,
        otpHash,
        expiresAt
      }
    })

    if (type === 'EMAIL') {
      if (isTestAccount) {
        return NextResponse.json({ success: true, message: 'OTP simulated successfully for test account.' }, { status: 200 })
      }

      let subject, html
      if (purpose === 'REGISTER') {
        const user = await prisma.user.findUnique({ where: { email: contact } })
        const template = welcomeVerificationEmail({ customerName: user?.name || 'User', otp })
        subject = template.subject
        html = template.html
      } else {
        const template = passwordlessOtpEmail({ otp })
        subject = template.subject
        html = template.html
      }
      
      try {
        const emailResult = await sendEmail({ to: contact, subject, html })
        if (!emailResult.sent) {
          console.error('SMTP Email Error:', emailResult.reason)
          return NextResponse.json({ error: 'Failed to send OTP email. Please check SMTP configuration.' }, { status: 500 })
        }
      } catch (emailError: any) {
        console.error('SMTP Email Error:', emailError)
        return NextResponse.json({ error: 'Failed to send email. Please check SMTP configuration in the Admin settings.' }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, message: 'OTP sent successfully.' }, { status: 200 })
    } else {
      // SMS is only supported for Indian mobile numbers (+91 or starting with 91)
      const cleanContact = contact.replace(/\s+/g, '')
      const isIndian = cleanContact.startsWith('+91') || /^[789]\d{9}$/.test(cleanContact) || cleanContact.startsWith('91')

      if (!isIndian) {
        return NextResponse.json({ error: 'SMS OTP verification is only supported for Indian mobile numbers (+91).' }, { status: 400 })
      }

      // Real SMS Flow using Textzi integration (for non-registration flows e.g. LOGIN)
      try {
        const smsResult = await sendOtpSms(contact, otp)
        if (!smsResult.success) {
          console.error('[SMS] Send OTP failed:', smsResult.message)
          return NextResponse.json({ error: smsResult.message || 'Failed to send OTP via SMS.' }, { status: 500 })
        }
      } catch (smsError: any) {
        console.error('[SMS] Send OTP failed with error:', smsError)
        return NextResponse.json({ error: 'Failed to send OTP via SMS.' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'OTP sent via SMS successfully.' }, { status: 200 })
    }
  } catch (err: any) {
    console.error('Error sending OTP:', err)
    return NextResponse.json({ error: 'Unable to send OTP. Please try again.' }, { status: 500 })
  }
}
