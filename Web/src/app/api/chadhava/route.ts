import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { effectivePrice } from '@/libs/pricing'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { expireStaleVideos } from '@/libs/videoUpload'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

// GET /api/chadhava — logged-in user's own orders, or ?all=1 for admins to see every order
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    await expireStaleVideos()

    const orders = await prisma.chadhavaOrder.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { chadhavaListing: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/chadhava — logged-in user books a Chadhava for themselves
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    const body = await req.json()
    const { name, gender, dob, birthPlace, comment, chadhavaListingId, persons } = body

    if (!name || !gender || !dob || !birthPlace || !chadhavaListingId) {
      return NextResponse.json(
        { error: 'name, gender, dob, birthPlace and chadhavaListingId are required.' },
        { status: 400 }
      )
    }

    // Chadhava is priced per person — persons must be a non-empty array of { name, gotra }.
    // Total charged = per-person price x persons.length, computed entirely from this
    // server-validated count (never trusted from any client-supplied total/amount field).
    const MAX_PERSONS = 20
    const MAX_FIELD_LEN = 100

    const validPersons = Array.isArray(persons)
      ? persons
          .filter(
            (p: any) =>
              p &&
              typeof p.name === 'string' &&
              p.name.trim() &&
              p.name.trim().length <= MAX_FIELD_LEN &&
              typeof p.gotra === 'string' &&
              p.gotra.trim() &&
              p.gotra.trim().length <= MAX_FIELD_LEN
          )
          .slice(0, MAX_PERSONS)
          .map((p: any) => ({ name: p.name.trim(), gotra: p.gotra.trim() }))
      : []

    if (validPersons.length === 0) {
      return NextResponse.json(
        { error: 'At least one person (name and gotra) is required for a Chadhava offering.' },
        { status: 400 }
      )
    }

    if (Array.isArray(persons) && persons.length > MAX_PERSONS) {
      return NextResponse.json({ error: `A single Chadhava order supports at most ${MAX_PERSONS} persons.` }, { status: 400 })
    }

    const listing = await prisma.chadhavaListing.findUnique({ where: { id: chadhavaListingId } })

    if (!listing) {
      return NextResponse.json({ error: 'Selected Chadhava listing does not exist.' }, { status: 404 })
    }

    const parsedDob = new Date(dob)

    if (Number.isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'dob must be a valid date.' }, { status: 400 })
    }

    const { ip, userAgent } = getRequestInfo(req)
    const personCount = validPersons.length
    const amountPaid = effectivePrice(listing) * personCount

    // Create a Razorpay Order
    const rzpOrderId = await createRazorpayOrder(amountPaid, `chadhava_receipt_${Date.now()}`)

    const order = await prisma.chadhavaOrder.create({
      data: {
        userId: user.id,
        chadhavaListingId: listing.id,
        name,
        gender,
        dob: parsedDob,
        birthPlace,
        comment,
        personCount,
        persons: validPersons,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        amountPaid,
        gstPercentage: listing.gstPercentage,
        gstInclusive: listing.gstInclusive,
        ipAddress: ip,
        userAgent,
        razorpayOrderId: rzpOrderId
      },
      include: { chadhavaListing: true }
    })

    await logOrderTrail({ 
      orderType: 'CHADHAVA', 
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
