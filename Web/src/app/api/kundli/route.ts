import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { effectivePrice } from '@/libs/pricing'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

// GET /api/kundli — logged-in user's own orders, or ?all=1 for admins to see every order
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const orders = await prisma.kundliOrder.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { kundliListing: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/kundli — logged-in user orders a handcrafted Kundli, selected from the admin-managed catalog
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    const body = await req.json()
    const { name, gender, dob, timeOfBirth, birthPlace, comment, kundliListingId } = body

    if (!name || !gender || !dob || !birthPlace) {
      return NextResponse.json({ error: 'name, gender, dob and birthPlace are required.' }, { status: 400 })
    }

    // A real catalog listing is required — this is the only source of truth for price. There
    // used to be a freeform kundliType fallback with no listing lookup, which let a request
    // create a PAID order with no verified price and no invoice at all. Removed.
    if (!kundliListingId) {
      return NextResponse.json({ error: 'kundliListingId is required.' }, { status: 400 })
    }

    const listing = await prisma.kundliListing.findUnique({ where: { id: kundliListingId } })

    if (!listing) {
      return NextResponse.json({ error: 'Selected Kundli type was not found.' }, { status: 400 })
    }

    const parsedDob = new Date(dob)

    if (Number.isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'dob must be a valid date.' }, { status: 400 })
    }

    const { ip, userAgent } = getRequestInfo(req)
    const amountPaid = effectivePrice(listing)

    // Create a Razorpay Order
    const rzpOrderId = await createRazorpayOrder(amountPaid, `kundli_receipt_${Date.now()}`)

    const order = await prisma.kundliOrder.create({
      data: {
        userId: user.id,
        kundliListingId: listing.id,
        name,
        gender,
        dob: parsedDob,
        timeOfBirth,
        birthPlace,
        comment,
        kundliType: listing.title,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        amountPaid,
        gstPercentage: listing.gstPercentage,
        gstInclusive: listing.gstInclusive,
        ipAddress: ip,
        userAgent,
        razorpayOrderId: rzpOrderId
      }
    })

    await logOrderTrail({ 
      orderType: 'KUNDLI', 
      orderId: order.id, 
      status: 'PENDING', 
      note: 'Order created — awaiting Razorpay payment verification', 
      actorId: user.id, 
      actorRole: 'USER', 
      req 
    })

    return NextResponse.json({
      order,
      razorpayOrder: {
        id: rzpOrderId,
        amount: Math.round(amountPaid * 100),
        currency: 'INR',
        key: await getRazorpayKeyId()
      }
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
