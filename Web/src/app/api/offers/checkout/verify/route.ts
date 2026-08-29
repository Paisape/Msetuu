import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { verifyRazorpaySignature, getRazorpayPaymentDetails } from '@/libs/razorpay'
import { handleApiError } from '@/libs/api-auth'
import { createInvoiceForOrder } from '@/libs/invoice'
import { paymentSuccessEmail } from '@/libs/emailTemplates'
import { sendEmail } from '@/libs/email'
import { sendOrderConfirmationSms } from '@/libs/sms'

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

    // 3. Amount integrity & payment method breakdown check
    let paidAmount = 0
    let paymentDetailsObj: any = null
    try {
      paymentDetailsObj = await getRazorpayPaymentDetails(razorpayPaymentId)
      paidAmount = paymentDetailsObj.amountRupees
    } catch (err: any) {
      return NextResponse.json({ error: `Could not verify payment details with Razorpay: ${err.message}` }, { status: 400 })
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
        paymentMethod: paymentDetailsObj?.formattedMethod || paymentDetailsObj?.method || 'ONLINE',
        paymentDetails: paymentDetailsObj || undefined,
        reconciledStatus: 'RECONCILED_AUTO',
        reconciledAt: new Date(),
        reconciliationNotes: `Payment verified via ${paymentDetailsObj?.formattedMethod || 'Online'}. Amount matched: ₹${paidAmount}.`
      }
    })

    // 4. Retrieve primary devotee details & offer link configuration to generate invoice & receipt
    try {
      const dbOrder = await prisma.offerLinkOrder.findUnique({
        where: { id: orderId },
        include: { devotees: true, offerLink: true }
      })

      if (dbOrder) {
        const primaryDevotee = dbOrder.devotees.find((d: any) => d.isPrimary) || dbOrder.devotees[0]
        const customerName = primaryDevotee?.name || 'Devotee'
        const customerEmail = primaryDevotee?.email || null

        const invoice = await createInvoiceForOrder({
          orderType: 'OFFER',
          orderId: dbOrder.id,
          userId: 'guest',
          customerName,
          customerEmail,
          itemLabel: `Offer booking: ${dbOrder.offerLink.title}`,
          amountCharged: Number(dbOrder.amount),
          gstPercentage: Number(dbOrder.offerLink.gstRate),
          gstInclusive: dbOrder.offerLink.gstIncluded
        })

        // Email receipt to devotee if email is valid and present
        if (customerEmail && customerEmail.includes('@')) {
          const { subject, html } = paymentSuccessEmail({
            customerName,
            itemLabel: `Offer booking: ${dbOrder.offerLink.title}`,
            amount: Number(dbOrder.amount),
            orderId: dbOrder.id,
            invoiceNumber: invoice.invoiceNumber
          })
          await sendEmail({ to: customerEmail, subject, html }).catch(e => console.error('[Email] Failed to send receipt:', e))
        }

        // DLT SMS Order Confirmation to devotee's mobile
        const customerPhone = primaryDevotee?.phone || null
        if (customerPhone && customerPhone.trim()) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mandirsetuu.com'
          const trackLink = `${appUrl}/front-pages/track-order?id=${dbOrder.id}`
          await sendOrderConfirmationSms({
            mobile: customerPhone,
            orderId: dbOrder.id,
            trackLink
          }).catch(smsErr => console.error('[SMS Order Confirmation] Failed best-effort SMS:', smsErr))
        }
      }
    } catch (invErr) {
      console.error('[Invoice Generation] Failed best-effort invoice:', invErr)
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
