import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { verifyRazorpaySignature } from '@/libs/razorpay'
import { createInvoiceForOrder } from '@/libs/invoice'
import { logOrderTrail } from '@/libs/orderTrail'
import { sendEmail } from '@/libs/email'
import { paymentSuccessEmail } from '@/libs/emailTemplates'

// POST /api/payment/verify — checks the Razorpay signature for a completed Checkout payment
// against the specific order it was created for, then (and only then) flips that order to PAID
// and generates its GST invoice. Every module's POST route only ever creates an order as
// PENDING with a razorpayOrderId attached to it — this is the ONLY place any order becomes
// PAID from a customer-facing flow.
//
// Three checks are load-bearing here and must never be removed:
//   1. order.userId === user.id           — you can only verify payment for your own order.
//   2. order.razorpayOrderId === razorpayOrderId — the payment being claimed must be the exact
//      one minted for THIS order, otherwise a genuine (but cheap) payment made by anyone could
//      be replayed against a completely different, more expensive order to "pay" for it free.
//   3. an atomic updateMany guarded by paymentStatus != 'PAID' — makes marking PAID + creating
//      the invoice happen at most once per order, even under a race or a replayed request.
export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const { orderType, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body

    if (!orderType || !orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ error: 'All Razorpay details (payment ID, order ID, signature) are required.' }, { status: 400 })
    }

    // 1. Fetch the order first — every check below depends on the real row, never on anything
    // the client claims.
    let order: any = null
    let itemLabel = ''
    let amountCharged = 0
    let gstPercentage = 0
    let gstInclusive = true
    let model: any = null

    if (orderType === 'CHADHAVA') {
      model = prisma.chadhavaOrder
      order = await model.findUnique({ where: { id: orderId }, include: { chadhavaListing: true, user: { select: { name: true, email: true } } } })
      if (!order) return NextResponse.json({ error: 'Chadhava order not found.' }, { status: 404 })
      amountCharged = order.amountPaid || 0
      itemLabel = `Chadhava — ${order.chadhavaListing?.title} (${order.personCount} person${order.personCount > 1 ? 's' : ''})`
    } else if (orderType === 'EPUJA') {
      model = prisma.pujaOrder
      order = await model.findUnique({ where: { id: orderId }, include: { pujaListing: true, pujaPackage: true, user: { select: { name: true, email: true } } } })
      if (!order) return NextResponse.json({ error: 'E-Puja order not found.' }, { status: 404 })
      amountCharged = order.amountPaid || 0
      itemLabel = `E-Puja — ${order.pujaListing?.title} (${order.pujaPackage?.type})`
    } else if (orderType === 'JYOTISH') {
      model = prisma.consultationBooking
      order = await model.findUnique({ where: { id: orderId }, include: { astrologer: true, user: { select: { name: true, email: true } } } })
      if (!order) return NextResponse.json({ error: 'Jyotish consultation not found.' }, { status: 404 })
      amountCharged = order.amountPaid || 0
      itemLabel = `Jyotish Consultation — ${order.astrologer?.name} (${order.durationMins} min, ${order.category})`
    } else if (orderType === 'KUNDLI') {
      model = prisma.kundliOrder
      order = await model.findUnique({ where: { id: orderId }, include: { kundliListing: true, user: { select: { name: true, email: true } } } })
      if (!order) return NextResponse.json({ error: 'Kundli order not found.' }, { status: 404 })
      amountCharged = order.amountPaid || 0
      itemLabel = `Kundli — ${order.kundliListing?.title || order.kundliType}`
    } else if (orderType === 'ECOMMERCE') {
      model = prisma.productOrder
      order = await model.findUnique({ where: { id: orderId }, include: { product: true, user: { select: { name: true, email: true } } } })
      if (!order) return NextResponse.json({ error: 'E-Commerce order not found.' }, { status: 404 })
      amountCharged = order.totalAmount || 0
      itemLabel = `${order.product?.name}${order.quantity > 1 ? ` x${order.quantity}` : ''}`
    } else if (orderType === 'OFFER') {
      model = prisma.offerOrder
      order = await model.findUnique({ where: { id: orderId }, include: { offer: true, user: { select: { name: true, email: true } } } })
      if (!order) return NextResponse.json({ error: 'Offer order not found.' }, { status: 404 })
      amountCharged = order.amountPaid || 0
      itemLabel = `Special Offer — ${order.offer?.title}`
    } else {
      return NextResponse.json({ error: 'Invalid orderType for payment verification.' }, { status: 400 })
    }

    gstPercentage = order.gstPercentage || 0
    gstInclusive = order.gstInclusive !== false

    // 2. Ownership — you can only verify payment for your own order.
    if (order.userId && order.userId !== user.id) {
      return NextResponse.json({ error: 'This order does not belong to you.' }, { status: 403 })
    }

    // 3. Binding — the razorpay_order_id being claimed must be the exact one this order row
    // was created with. Without this check, ANY validly-signed payment (e.g. a real ₹1 test
    // payment made for a different, cheap order) could be replayed here with a different
    // orderId to mark an unrelated, more expensive order as PAID for free.
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ error: 'razorpay_order_id does not match this order.' }, { status: 400 })
    }

    // 4. Idempotency — once PAID, never re-process (blocks duplicate invoices from a retried
    // or replayed verify call).
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'This order has already been paid for.' }, { status: 409 })
    }

    // 5. Verify payment signature
    const isValid = await verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      await model.updateMany({
        where: { id: orderId, paymentStatus: { not: 'PAID' } },
        data: { paymentStatus: 'FAILED', razorpayPaymentId, razorpaySignature }
      })

      return NextResponse.json({ error: 'Payment verification failed. If money was deducted, it will be refunded — please contact support.' }, { status: 400 })
    }

    // 6. Atomically flip PENDING -> PAID. The where clause guards against a race where two
    // requests verify the same order concurrently — only one can win, so step 7 (invoice
    // creation) below only ever runs once per order.
    const claim = await model.updateMany({
      where: { id: orderId, paymentStatus: { not: 'PAID' } },
      data: { paymentStatus: 'PAID', razorpayOrderId, razorpayPaymentId, razorpaySignature }
    })

    if (claim.count === 0) {
      return NextResponse.json({ error: 'This order has already been paid for.' }, { status: 409 })
    }

    // 7. Create GST invoice for this paid order (amountCharged/gst fields come from the order
    // row itself, computed server-side at order-creation time — never from this request body).
    const invoice = await createInvoiceForOrder({
      orderType,
      orderId,
      userId: order.userId,
      customerName: order.name || order.user?.name || 'Customer',
      customerEmail: order.user?.email,
      itemLabel,
      amountCharged,
      gstPercentage,
      gstInclusive
    })

    // 7b. Email the customer a payment receipt. Best-effort — never blocks the response.
    if (order.user?.email) {
      const { subject, html } = paymentSuccessEmail({
        customerName: order.name || order.user?.name || 'Devotee',
        itemLabel,
        amount: amountCharged,
        orderId,
        invoiceNumber: invoice.invoiceNumber
      })

      await sendEmail({ to: order.user.email, subject, html })
    }

    // 8. Log order trail
    await logOrderTrail({
      orderType,
      orderId,
      status: order.status,
      note: `Payment verified via Razorpay Sandbox (Payment ID: ${razorpayPaymentId})`,
      actorId: user.id,
      actorRole: 'USER',
      req
    })

    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    return handleApiError(err)
  }
}
