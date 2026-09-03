import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sendOrderConfirmationSms } from '@/libs/sms'

// POST /api/admin/orders/resend-sms — Dispatch or resend confirmation SMS for any order on demand
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { orderId, orderType = 'OFFER_LINK', mobileOverride } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })
    }

    let targetMobile = mobileOverride?.trim() || ''
    let trackingId = orderId
    let orderDescription = ''

    // 1. If Offer Link Order
    const offerOrder = await prisma.offerLinkOrder.findUnique({
      where: { id: orderId },
      include: { devotees: true, offerLink: true }
    })

    if (offerOrder) {
      if (!targetMobile) {
        const primary = offerOrder.devotees.find(d => d.isPrimary) || offerOrder.devotees[0]
        targetMobile = primary?.phone || ''
      }
      trackingId = offerOrder.id
      orderDescription = `Offer: ${offerOrder.offerLink.title}`
    } else {
      // 2. Check other order tables (Chadhava, E-Puja, Ecommerce, Kundli, Jyotish)
      const [chadhava, puja, product, kundli, jyotish] = await Promise.all([
        prisma.chadhavaOrder.findUnique({ where: { id: orderId }, include: { user: true } }),
        prisma.pujaOrder.findUnique({ where: { id: orderId }, include: { user: true } }),
        prisma.productOrder.findUnique({ where: { id: orderId }, include: { user: true } }),
        prisma.kundliOrder.findUnique({ where: { id: orderId }, include: { user: true } }),
        prisma.consultationBooking.findUnique({ where: { id: orderId }, include: { user: true } })
      ])

      const genericOrder = chadhava || puja || product || kundli || jyotish

      if (!genericOrder) {
        return NextResponse.json({ error: `Order not found with ID ${orderId}.` }, { status: 404 })
      }

      if (!targetMobile) {
        targetMobile =
          (genericOrder as any).devoteePhone ||
          (genericOrder as any).customerPhone ||
          (genericOrder as any).user?.phone ||
          ''
      }

      trackingId = genericOrder.id
      orderDescription = `Order: ${orderId}`
    }

    if (!targetMobile) {
      return NextResponse.json({
        error: 'No mobile number found for this order. Please specify a mobile number to send the SMS.'
      }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mandirsetuu.com'
    const cleanAlphanumeric = trackingId.replace(/[^a-zA-Z0-9]/g, '')
    const shortOrderId = (cleanAlphanumeric.length > 8 ? cleanAlphanumeric.slice(0, 8) : cleanAlphanumeric || 'ORDER').toUpperCase()
    const trackLink = `${appUrl}/t/?id=${shortOrderId}`

    const smsResult = await sendOrderConfirmationSms({
      mobile: targetMobile,
      orderId: trackingId,
      trackLink
    })

    if (!smsResult.success) {
      return NextResponse.json({
        success: false,
        error: smsResult.message || 'SMS gateway rejected dispatch.',
        response: smsResult.response
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: `Order confirmation SMS successfully dispatched to ${targetMobile}!`,
      mobile: targetMobile,
      orderId: trackingId,
      description: orderDescription,
      gatewayResponse: smsResult.response
    })
  } catch (err) {
    return handleApiError(err)
  }
}
