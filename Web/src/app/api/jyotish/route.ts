import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { effectivePrice } from '@/libs/pricing'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

const VALID_DURATIONS = new Set([30, 60])

// GET /api/jyotish — logged-in user's own consultation requests, or ?all=1 for admins
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const bookings = await prisma.consultationBooking.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { astrologer: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bookings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/jyotish — user submits a consultation request (problem category + preferred slot).
// If the user booked from a specific astrologer's card, astrologerId is sent and priced
// immediately (duration-based price snapshot, PAID + GST invoice — same pattern as every other
// module). If astrologerId is omitted, the booking falls back to the legacy "admin assigns an
// astrologer later" flow with no price yet.
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const { category, duration, slotTime, comment, astrologerId, name, email, phone, dob, timeOfBirth, placeOfBirth } = body

    if (!category || !slotTime) {
      return NextResponse.json({ error: 'category and slotTime are required.' }, { status: 400 })
    }

    // The consultation form (replacing the old astrologer-browsing list) always collects these —
    // required for every booking now, not just the legacy admin-assigned flow.
    if (!name || !email || !phone || !dob || !timeOfBirth || !placeOfBirth) {
      return NextResponse.json(
        { error: 'name, email, phone, dob, timeOfBirth and placeOfBirth are required.' },
        { status: 400 }
      )
    }

    const purpose = typeof comment === 'string' ? comment.trim() : ''
    const wordCount = purpose ? purpose.split(/\s+/).filter(Boolean).length : 0

    if (wordCount < 10) {
      return NextResponse.json({ error: 'Purpose of consultation must be at least 10 words.' }, { status: 400 })
    }

    const parsedDob = new Date(dob)

    if (Number.isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'dob must be a valid date.' }, { status: 400 })
    }

    const durationMins = Number(duration)

    if (!VALID_DURATIONS.has(durationMins)) {
      return NextResponse.json({ error: 'duration must be 30 or 60 (minutes).' }, { status: 400 })
    }

    const parsedSlot = new Date(slotTime)

    if (Number.isNaN(parsedSlot.getTime()) || parsedSlot.getTime() < Date.now()) {
      return NextResponse.json({ error: 'slotTime must be a valid future date/time.' }, { status: 400 })
    }

    if (astrologerId && !(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    let astrologer = null as Awaited<ReturnType<typeof prisma.astrologer.findUnique>> | null

    if (astrologerId) {
      astrologer = await prisma.astrologer.findUnique({ where: { id: astrologerId } })

      if (!astrologer) {
        return NextResponse.json({ error: 'Selected astrologer does not exist.' }, { status: 404 })
      }
    }

    const { ip, userAgent } = getRequestInfo(req)

    const priced = astrologer
      ? {
          price: durationMins === 60 ? astrologer.price60 : astrologer.price30,
          offerPrice: durationMins === 60 ? astrologer.offerPrice60 : astrologer.offerPrice30,
          gstPercentage: astrologer.gstPercentage,
          gstInclusive: astrologer.gstInclusive
        }
      : null

    const amountPaid = priced ? effectivePrice(priced) : null
    let rzpOrderId: string | null = null
    let razorpayKeyId: string | undefined

    if (amountPaid !== null) {
      rzpOrderId = await createRazorpayOrder(amountPaid, `jyotish_receipt_${Date.now()}`)
      razorpayKeyId = await getRazorpayKeyId()
    }

    const booking = await prisma.consultationBooking.create({
      data: {
        userId: user.id,
        astrologerId: astrologer?.id,
        name: String(name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        dob: parsedDob,
        timeOfBirth: String(timeOfBirth).trim(),
        placeOfBirth: String(placeOfBirth).trim(),
        category,
        durationMins,
        slotTime: parsedSlot,
        comment: purpose,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        amountPaid,
        gstPercentage: astrologer?.gstPercentage,
        gstInclusive: astrologer?.gstInclusive,
        ipAddress: ip,
        userAgent,
        razorpayOrderId: rzpOrderId
      },
      include: { astrologer: true }
    })

    await logOrderTrail({
      orderType: 'JYOTISH',
      orderId: booking.id,
      status: 'PENDING',
      note: astrologer
        ? 'Consultation booking created — awaiting Razorpay payment verification'
        : 'Consultation requested — awaiting astrologer assignment',
      actorId: user.id,
      actorRole: 'USER',
      req
    })

    return NextResponse.json({
      booking,
      razorpayOrder: rzpOrderId ? {
        id: rzpOrderId,
        amount: Math.round((amountPaid || 0) * 100),
        currency: 'INR',
        key: razorpayKeyId
      } : null
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
