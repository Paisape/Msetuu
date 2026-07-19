import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { effectivePrice } from '@/libs/pricing'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'

// GET /api/ecommerce — logged-in user's own orders, or ?all=1 for admins to see every order
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const orders = await prisma.productOrder.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/ecommerce — logged-in user places a product order
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Online payments are not configured yet. Please contact support.' }, { status: 503 })
    }

    const body = await req.json()
    const { productId, carat, quantity, address } = body

    if (!productId || !address) {
      return NextResponse.json({ error: 'productId and address are required.' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })

    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

    const parsedQuantity = quantity !== undefined ? Number(quantity) : 1

    // Upper bound prevents integer-overflow / nonsensical-total abuse from a directly crafted
    // request (the storefront UI never lets a user pick more than this anyway).
    const MAX_QUANTITY = 20

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > MAX_QUANTITY) {
      return NextResponse.json({ error: `quantity must be a whole number between 1 and ${MAX_QUANTITY}.` }, { status: 400 })
    }

    let parsedCarat: number | null = null

    if (product.category === 'Gemstones') {
      // Bounds must be enforced here, server-side — the storefront's carat slider (3.5–12.5)
      // is a UI convenience only. Without this check, a request crafted directly against the
      // API (bypassing the slider entirely) could set an arbitrarily tiny carat value and pay
      // a fraction of a cent for a real gemstone, since price = rate x carat x quantity.
      // Matches the storefront's own advertised range ("custom sizes 3.5 to 12.5 carats" —
      // see the Ecommerce FAQ), so the server never accepts anything the UI wouldn't offer.
      const MIN_CARAT = 3.5
      const MAX_CARAT = 12.5

      parsedCarat = Number(carat)

      if (!carat || !Number.isFinite(parsedCarat) || parsedCarat < MIN_CARAT || parsedCarat > MAX_CARAT) {
        return NextResponse.json({ error: `carat is required for gemstone products and must be between ${MIN_CARAT} and ${MAX_CARAT}.` }, { status: 400 })
      }
    }

    const rate = effectivePrice(product)
    const pricePerUnit = parsedCarat ? rate * parsedCarat : rate
    const totalAmount = pricePerUnit * parsedQuantity

    const { ip, userAgent } = getRequestInfo(req)

    // Create a Razorpay Order
    const rzpOrderId = await createRazorpayOrder(totalAmount, `ecommerce_receipt_${Date.now()}`)

    const order = await prisma.productOrder.create({
      data: {
        userId: user.id,
        productId: product.id,
        carat: parsedCarat,
        quantity: parsedQuantity,
        totalAmount,
        paymentStatus: 'PENDING',
        shippingAddress: address,
        status: 'PENDING',
        gstPercentage: product.gstPercentage,
        gstInclusive: product.gstInclusive,
        ipAddress: ip,
        userAgent,
        razorpayOrderId: rzpOrderId
      },
      include: { product: true }
    })

    await logOrderTrail({ 
      orderType: 'ECOMMERCE', 
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
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        key: await getRazorpayKeyId()
      }
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
