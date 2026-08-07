import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { enforceRateLimit } from '@/libs/rateLimit'
import { logActivity } from '@/libs/activityLog'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const contact = typeof body.contact === 'string' ? body.contact.trim().toLowerCase() : ''
    const otp = typeof body.otp === 'string' ? body.otp.trim() : ''
    
    // We reuse the standard LOGIN purpose OTP for verification on the public page
    const purpose = 'LOGIN'

    if (!contact || !otp) {
      return NextResponse.json({ error: 'Contact and OTP are required.' }, { status: 400 })
    }

    const rateLimited = enforceRateLimit(req, 'public-delete-account', { limit: 5, windowMs: 15 * 60 * 1000, identifier: contact })
    if (rateLimited) return rateLimited

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
    
    const user = isEmail 
      ? await prisma.user.findUnique({ where: { email: contact } })
      : await prisma.user.findFirst({ where: { phone: contact } })

    if (!user) {
      return NextResponse.json({ error: 'No account found with this contact information.' }, { status: 404 })
    }

    // Log the deletion
    await logActivity({
      userId: user.id,
      email: user.email || 'unknown',
      role: user.role,
      action: 'ACCOUNT_DELETED',
      details: 'User deleted their own account from the public web portal via OTP.'
    })

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ success: true, message: 'Your account and all associated personal data have been successfully deleted.' })

  } catch (err: any) {
    console.error('Error in public account deletion:', err)
    return NextResponse.json({ error: 'An unexpected error occurred while deleting your account.' }, { status: 500 })
  }
}
