import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { effectivePrice } from '@/libs/pricing'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { expireStaleVideos } from '@/libs/videoUpload'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

const MAX_DEVOTEES = 20

// Validates the client-submitted `devotees` array server-side: caps count, checks shape, trims
// text. Returns `undefined` (meaning "not provided") for anything malformed/empty rather than
// throwing, since a booking with no extra family members is valid (Single package).
function sanitizeDevotees(input: unknown): { name: string; gotra: string }[] | undefined {
  if (!Array.isArray(input)) return undefined

  const sanitized = input
    .slice(0, MAX_DEVOTEES)
    .map((item: any) => ({
      name: typeof item?.name === 'string' ? item.name.trim().slice(0, 200) : '',
      gotra: typeof item?.gotra === 'string' ? item.gotra.trim().slice(0, 200) : ''
    }))
    .filter(item => item.name && item.gotra)

  return sanitized.length > 0 ? sanitized : undefined
}

// GET /api/epuja — logged-in user's own orders, or ?all=1 for admins to see every order
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    await expireStaleVideos()

    const orders = await prisma.pujaOrder.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { pujaListing: true, pujaPackage: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/epuja — logged-in user books an E-Puja package for themselves
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    const body = await req.json()
    const { name, gender, dob, birthPlace, comment, pujaListingId, pujaPackageId, devotees } = body

    if (!name || !gender || !dob || !birthPlace || !pujaListingId || !pujaPackageId) {
      return NextResponse.json(
        { error: 'name, gender, dob, birthPlace, pujaListingId and pujaPackageId are required.' },
        { status: 400 }
      )
    }

    const pkg = await prisma.pujaPackage.findUnique({ where: { id: pujaPackageId }, include: { pujaListing: true } })

    if (!pkg || pkg.pujaListingId !== pujaListingId) {
      return NextResponse.json({ error: 'Selected package does not belong to the chosen listing.' }, { status: 400 })
    }

    const parsedDob = new Date(dob)

    if (Number.isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'dob must be a valid date.' }, { status: 400 })
    }

    const { ip, userAgent } = getRequestInfo(req)
    const amountPaid = effectivePrice(pkg) // package bundle price — not multiplied by devotee count
    const sanitizedDevotees = sanitizeDevotees(devotees)

    // Create a Razorpay Order
    const rzpOrderId = await createRazorpayOrder(amountPaid, `epuja_receipt_${Date.now()}`)

    const order = await prisma.pujaOrder.create({
      data: {
        userId: user.id,
        pujaListingId,
        pujaPackageId,
        name,
        gender,
        dob: parsedDob,
        birthPlace,
        comment,
        devotees: sanitizedDevotees,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        amountPaid,
        gstPercentage: pkg.gstPercentage,
        gstInclusive: pkg.gstInclusive,
        ipAddress: ip,
        userAgent,
        razorpayOrderId: rzpOrderId
      },
      include: { pujaListing: true, pujaPackage: true }
    })

    await logOrderTrail({ 
      orderType: 'EPUJA', 
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
