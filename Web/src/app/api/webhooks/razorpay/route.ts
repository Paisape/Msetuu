import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { verifyRazorpayWebhookSignature } from '@/libs/razorpay'
import { confirmOfferBookingAndNotify } from '@/libs/offerBooking'
import { createInvoiceForOrder } from '@/libs/invoice'
import { sendOrderConfirmationSms } from '@/libs/sms'

// POST /api/webhooks/razorpay - Background Webhook listener for direct Razorpay payment events
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 })
    }

    // 1. Verify HMAC Signature
    const isValid = await verifyRazorpayWebhookSignature(rawBody, signature)
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature received.')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event

    console.log(`[Razorpay Webhook] Received verified event: ${event}`)

    // Handle payment.captured or order.paid events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity
      const orderEntity = payload.payload?.order?.entity

      const rzpOrderId = paymentEntity?.order_id || orderEntity?.id
      const rzpPaymentId = paymentEntity?.id

      if (!rzpOrderId && !rzpPaymentId) {
        return NextResponse.json({ received: true, message: 'No order or payment ID found in webhook entity.' })
      }

      // 1. Check OfferLinkOrder (Offer links / campaign orders)
      const offerOrder = await prisma.offerLinkOrder.findFirst({
        where: {
          OR: [
            { paymentId: rzpOrderId },
            { paymentId: rzpPaymentId }
          ]
        }
      })

      if (offerOrder) {
        if (offerOrder.paymentStatus !== 'SUCCESS') {
          console.log(`[Razorpay Webhook] Auto-reconciling OfferLinkOrder ${offerOrder.id} via Webhook event: ${event}`)

          const method = String(paymentEntity?.method || 'ONLINE').toUpperCase()
          const vpa = paymentEntity?.vpa
          const formattedMethod = method === 'UPI' && vpa ? `UPI (${vpa})` : method

          await confirmOfferBookingAndNotify({
            orderId: offerOrder.id,
            paymentId: rzpPaymentId || offerOrder.paymentId || rzpOrderId,
            paymentMethod: formattedMethod,
            paymentDetails: paymentEntity || undefined,
            reconciledStatus: 'RECONCILED_AUTO',
            notes: `Auto-reconciled via Razorpay Webhook (${event}).`
          })
        }

        return NextResponse.json({ received: true, reconciled: true, type: 'OFFER_LINK', orderId: offerOrder.id })
      }

      // 2. Check Other Order Tables (Chadhava, E-Puja, Ecommerce, Kundli, Jyotish)
      if (rzpOrderId) {
        // Chadhava
        const chadhava = await prisma.chadhavaOrder.findFirst({ where: { razorpayOrderId: rzpOrderId, paymentStatus: { not: 'PAID' } } })
        if (chadhava) {
          await prisma.chadhavaOrder.update({
            where: { id: chadhava.id },
            data: { paymentStatus: 'PAID', razorpayPaymentId: rzpPaymentId || 'webhook_captured' }
          })
          await createInvoiceForOrder({
            orderType: 'CHADHAVA',
            orderId: chadhava.id,
            userId: chadhava.userId,
            customerName: chadhava.devoteeName || 'Devotee',
            itemLabel: 'Chadhava offering',
            amountCharged: chadhava.amountPaid || 0
          }).catch(() => null)
          return NextResponse.json({ received: true, reconciled: true, type: 'CHADHAVA', orderId: chadhava.id })
        }

        // E-Puja
        const puja = await prisma.pujaOrder.findFirst({ where: { razorpayOrderId: rzpOrderId, paymentStatus: { not: 'PAID' } } })
        if (puja) {
          await prisma.pujaOrder.update({
            where: { id: puja.id },
            data: { paymentStatus: 'PAID', razorpayPaymentId: rzpPaymentId || 'webhook_captured' }
          })
          return NextResponse.json({ received: true, reconciled: true, type: 'EPUJA', orderId: puja.id })
        }

        // Product Order
        const product = await prisma.productOrder.findFirst({ where: { razorpayOrderId: rzpOrderId, paymentStatus: { not: 'PAID' } } })
        if (product) {
          await prisma.productOrder.update({
            where: { id: product.id },
            data: { paymentStatus: 'PAID', razorpayPaymentId: rzpPaymentId || 'webhook_captured' }
          })
          return NextResponse.json({ received: true, reconciled: true, type: 'ECOMMERCE', orderId: product.id })
        }
      }
    }

    return NextResponse.json({ received: true, event })
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err)
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 })
  }
}
