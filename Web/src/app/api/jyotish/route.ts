import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { enforceRateLimit } from '@/libs/rateLimit'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { effectivePrice } from '@/libs/pricing'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

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

// Session length options the booking form offers — price is looked up from the matching
// JyotishCategory.price{30,60,90}/offerPrice{30,60,90} pair below.
const DURATION_OPTIONS = [30, 60, 90] as const

// POST /api/jyotish — user submits a consultation request via the single booking form
// (gemsmantra.com/pages/consultation style — no astrologer browsing, no calendar slot picker).
// `category` (e.g. "Kundli Reading", "Vastu Consultation") must match an active JyotishCategory;
// `durationMins` (30/60/90) selects which of that category's three price tiers applies. A
// separate `purpose` field previously existed for life-area classification but was removed since
// it duplicated category. An admin assigns an astrologer and the actual calendar slot after
// payment — never chosen by the visitor.
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const rateLimited = enforceRateLimit(req, 'order-create', { limit: 20, windowMs: 60 * 60 * 1000, identifier: user.id, skipIp: true })

    if (rateLimited) return rateLimited

    const body = await req.json()
    const { category, durationMins, comment, name, email, phone, dob, timeOfBirth, placeOfBirth } = body

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'category is required.' }, { status: 400 })
    }

    const parsedDuration = Number(durationMins)

    if (!DURATION_OPTIONS.includes(parsedDuration as (typeof DURATION_OPTIONS)[number])) {
      return NextResponse.json({ error: 'durationMins is required and must be 30, 60 or 90.' }, { status: 400 })
    }

    if (!name || !email || !phone || !dob || !timeOfBirth || !placeOfBirth) {
      return NextResponse.json(
        { error: 'name, email, phone, dob, timeOfBirth and placeOfBirth are required.' },
        { status: 400 }
      )
    }

    const problemDescription = typeof comment === 'string' ? comment.trim() : ''
    const wordCount = problemDescription ? problemDescription.split(/\s+/).filter(Boolean).length : 0

    if (wordCount < 10) {
      return NextResponse.json({ error: 'Please describe your problem in at least 10 words.' }, { status: 400 })
    }

    const parsedDob = new Date(dob)

    if (Number.isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'dob must be a valid date.' }, { status: 400 })
    }

    const jyotishCategory = await prisma.jyotishCategory.findFirst({ where: { name: category, active: true } })

    if (!jyotishCategory) {
      return NextResponse.json({ error: 'Selected category is not available. Please choose another.' }, { status: 404 })
    }

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    const { ip, userAgent } = getRequestInfo(req)

    // Pick the price/offerPrice pair matching the chosen duration tier — same category, three
    // different rates, e.g. Kundli Reading: 30min=₹500, 60min=₹1000, 90min=₹1500.
    const priced = {
      price: parsedDuration === 30 ? jyotishCategory.price30 : parsedDuration === 60 ? jyotishCategory.price60 : jyotishCategory.price90,
      offerPrice: parsedDuration === 30 ? jyotishCategory.offerPrice30 : parsedDuration === 60 ? jyotishCategory.offerPrice60 : jyotishCategory.offerPrice90,
      gstPercentage: jyotishCategory.gstPercentage,
      gstInclusive: jyotishCategory.gstInclusive
    }

    const amountPaid = effectivePrice(priced)
    const rzpOrderId = await createRazorpayOrder(amountPaid, `jyotish_receipt_${Date.now()}`)
    const razorpayKeyId = await getRazorpayKeyId()

    const booking = await prisma.consultationBooking.create({
      data: {
        userId: user.id,
        name: String(name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        dob: parsedDob,
        timeOfBirth: String(timeOfBirth).trim(),
        placeOfBirth: String(placeOfBirth).trim(),
        category: jyotishCategory.name,
        durationMins: parsedDuration,
        comment: problemDescription,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        amountPaid,
        gstPercentage: jyotishCategory.gstPercentage,
        gstInclusive: jyotishCategory.gstInclusive,
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
      note: 'Consultation booking created — awaiting Razorpay payment verification',
      actorId: user.id,
      actorRole: 'USER',
      req
    })

    return NextResponse.json({
      booking,
      razorpayOrder: {
        id: rzpOrderId,
        amount: Math.round(amountPaid * 100),
        currency: 'INR',
        key: razorpayKeyId
      }
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
