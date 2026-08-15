import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { verifyRazorpaySignature, getRazorpayPaymentAmount } from '@/libs/razorpay'
import { handleApiError } from '@/libs/api-auth'

// POST /api/offers/checkout/verify - Verify payment transaction signature and amount integrity
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment signature verification parameters.' }, { status: 400 })
    }

    const order = await prisma.offerLinkOrder.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // 1. Binding check — protect against signature replay attacks
    if (!order.paymentId || order.paymentId !== razorpayOrderId) {
      return NextResponse.json({ error: 'Razorpay order ID does not match this booking.' }, { status: 400 })
    }

    if (order.paymentStatus === 'SUCCESS') {
      return NextResponse.json({ success: true, message: 'Payment already reconciled.' })
    }

    // 2. Cryptographic signature verification
    const isValid = await verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      await prisma.offerLinkOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          reconciliationNotes: 'Payment verification failed: invalid cryptographic signature.'
        }
      })
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 })
    }

    // 3. Amount integrity check — retrieve paid amount from gateway and assert matches database order amount
    let paidAmount = 0
    try {
      paidAmount = await getRazorpayPaymentAmount(razorpayPaymentId)
    } catch (err: any) {
      return NextResponse.json({ error: `Could not verify payment amount with Razorpay: ${err.message}` }, { status: 400 })
    }

    const expectedAmount = Number(order.amount)
    if (Math.abs(paidAmount - expectedAmount) >= 0.05) {
      // Discrepancy detected: amount paid differs from amount recorded at checkout
      await prisma.offerLinkOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          reconciledStatus: 'DISCREPANCY',
          reconciliationNotes: `Payment discrepancy: Devotee paid ₹${paidAmount} but order was created for ₹${expectedAmount}.`
        }
      })
      return NextResponse.json({ 
        error: `Payment amount mismatch: Order expects ₹${expectedAmount} but ₹${paidAmount} was paid. Order has been marked discrepant.` 
      }, { status: 400 })
    }

    // Update order status to paid and verify reconciliation
    const updated = await prisma.offerLinkOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'SUCCESS',
        paymentId: razorpayPaymentId,
        reconciledStatus: 'RECONCILED_AUTO',
        reconciledAt: new Date(),
        reconciliationNotes: `Payment verified and settled successfully online. Amount matched: ₹${paidAmount}.`
      }
    })

    return NextResponse.json({ success: true, order: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
