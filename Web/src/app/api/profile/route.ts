import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { enforceRateLimit } from '@/libs/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/profile — fetch the logged-in user's personal details
export async function GET() {
  try {
    const user = await requireUser()

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        occupation: true,
        dob: true,
        tob: true,
        pob: true,
        gender: true,
        gotra: true
      }
    })

    return NextResponse.json(profile)
  } catch (err) {
    return handleApiError(err)
  }
}

// PUT /api/profile — update the logged-in user's personal details
export async function PUT(req: Request) {
  try {
    const user = await requireUser()

    const rateLimited = enforceRateLimit(req, 'profile-update', { limit: 10, windowMs: 60 * 60 * 1000, identifier: user.id, skipIp: true })
    if (rateLimited) return rateLimited

    const body = await req.json()
    const { name, email, phone, image, occupation, dob, tob, pob, gender, gotra } = body

    const data: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
        return NextResponse.json({ error: 'Please provide a valid name.' }, { status: 400 })
      }
      data.name = name.trim()
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
      }
      
      const trimmedEmail = email.trim().toLowerCase()
      // Check if email is already taken by someone else
      if (trimmedEmail !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } })
        if (existing) {
          return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 })
        }
      }
      data.email = trimmedEmail
    }

    if (phone !== undefined) {
      if (phone !== null && (typeof phone !== 'string' || phone.trim().length === 0)) {
        return NextResponse.json({ error: 'Please provide a valid phone number.' }, { status: 400 })
      }
      
      const trimmedPhone = phone ? phone.trim() : null
      // Check if phone is already taken by someone else
      if (trimmedPhone) {
        const existing = await prisma.user.findFirst({ where: { phone: trimmedPhone } })
        if (existing && existing.id !== user.id) {
          return NextResponse.json({ error: 'This phone number is already in use.' }, { status: 400 })
        }
      }
      data.phone = trimmedPhone
    }

    if (image !== undefined) {
      if (image !== null && typeof image !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid image URL.' }, { status: 400 })
      }
      data.image = image
    }

    if (occupation !== undefined) {
      if (occupation !== null && typeof occupation !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid occupation.' }, { status: 400 })
      }
      data.occupation = occupation ? occupation.trim() : null
    }

    if (dob !== undefined) {
      if (dob !== null && typeof dob !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid Date of Birth.' }, { status: 400 })
      }
      data.dob = dob ? dob.trim() : null
    }

    if (tob !== undefined) {
      if (tob !== null && typeof tob !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid Time of Birth.' }, { status: 400 })
      }
      data.tob = tob ? tob.trim() : null
    }

    if (pob !== undefined) {
      if (pob !== null && typeof pob !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid Place of Birth.' }, { status: 400 })
      }
      data.pob = pob ? pob.trim() : null
    }

    if (gender !== undefined) {
      if (gender !== null && typeof gender !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid gender.' }, { status: 400 })
      }
      data.gender = gender ? gender.trim() : null
    }

    if (gotra !== undefined) {
      if (gotra !== null && typeof gotra !== 'string') {
        return NextResponse.json({ error: 'Please provide a valid Gotra.' }, { status: 400 })
      }
      data.gotra = gotra ? gotra.trim() : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields provided to update.' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        occupation: true,
        dob: true,
        tob: true,
        pob: true,
        gender: true,
        gotra: true
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (err) {
    return handleApiError(err)
  }
}
