import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getCurrentUser, handleApiError } from '@/libs/api-auth'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

// POST /api/offer/[slug]/order — Initiates payment and creates a pending order for an offer
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const user = await getCurrentUser() // Allow optional user login (guest checkout is supported by order but frontend enforces auth)

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    const offer = await prisma.offer.findUnique({ where: { slug } })

    if (!offer || !offer.active) {
      return NextResponse.json({ error: 'This special offer is not active or does not exist.' }, { status: 404 })
    }

    const body = await req.json()
    const { name, email, phone, comment, packageName, devotees } = body

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'name, email, and phone are required.' }, { status: 400 })
    }

    let amountPaid = offer.offerPrice
    let personCount = 1

    if (offer.pricingType === 'PER_PERSON') {
      if (!devotees || !Array.isArray(devotees) || devotees.length === 0) {
        return NextResponse.json({ error: 'At least one devotee must be specified for per-person pricing.' }, { status: 400 })
      }

      personCount = devotees.length
      amountPaid = offer.offerPrice * personCount
    } else if (offer.pricingType === 'PACKAGE') {
      if (!packageName) {
        return NextResponse.json({ error: 'packageName is required for package-wise pricing.' }, { status: 400 })
      }

      const packagesList = offer.packages ? (offer.packages as any[]) : []
      const matched = packagesList.find(p => p.name === packageName)

      if (!matched) {
        return NextResponse.json({ error: `Package option "${packageName}" was not found.` }, { status: 400 })
      }

      amountPaid = matched.offerPrice
    }

    const { ip, userAgent } = getRequestInfo(req)

    // Mint a new Razorpay order
    const rzpOrderId = await createRazorpayOrder(amountPaid, `offer_${offer.id}`)

    const order = await prisma.offerOrder.create({
      data: {
        offerId: offer.id,
        userId: user?.id || null,
        name,
        email,
        phone,
        comment,
        packageName: offer.pricingType === 'PACKAGE' ? packageName : null,
        personCount,
        devotees: offer.pricingType === 'PER_PERSON' ? devotees : null,
        amountPaid,
        gstPercentage: offer.gstPercentage,
        gstInclusive: offer.gstInclusive,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        ipAddress: ip,
        userAgent,
        razorpayOrderId: rzpOrderId
      },
      include: { offer: true }
    })

    await logOrderTrail({
      orderType: 'OFFER',
      orderId: order.id,
      status: 'PENDING',
      note: `Offer order created for "${offer.title}" — awaiting Razorpay payment verification`,
      actorId: user?.id || null,
      actorRole: user ? 'USER' : 'SYSTEM',
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
