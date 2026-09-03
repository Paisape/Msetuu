import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getRazorpayPaymentsForOrder } from '@/libs/razorpay'
import { confirmOfferBookingAndNotify } from '@/libs/offerBooking'

// POST /api/offers/reconcile/sync-razorpay — Direct Razorpay API sync for pending offer link orders
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()

    const body = await req.json().catch(() => ({}))
    const { orderId } = body

    // 1. Fetch target pending orders
    const whereClause: any = {
      paymentStatus: 'PENDING'
    }

    if (orderId) {
      whereClause.id = orderId
    }

    const pendingOrders = await prisma.offerLinkOrder.findMany({
      where: whereClause,
      include: {
        devotees: true,
        offerLink: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders found to reconcile.',
        checkedCount: 0,
        reconciledCount: 0,
        reconciledOrders: []
      })
    }

    let reconciledCount = 0
    const reconciledOrders: any[] = []

    // 2. Query Razorpay API for each pending order
    for (const order of pendingOrders) {
      const rzpOrderId = order.paymentId // Contains 'order_xxxx'

      if (!rzpOrderId || !rzpOrderId.startsWith('order_')) {
        continue
      }

      try {
        const payments = await getRazorpayPaymentsForOrder(rzpOrderId)

        // Look for successful payment
        const successfulPayment = payments.find(
          (p: any) => p.status === 'captured' || p.status === 'authorized'
        )

        if (successfulPayment) {
          const method = String(successfulPayment.method || 'online').toUpperCase()
          const vpa = successfulPayment.vpa
          const formattedMethod = method === 'UPI' && vpa ? `UPI (${vpa})` : method
          const paidRupees = Number(successfulPayment.amount) / 100

          const updated = await confirmOfferBookingAndNotify({
            orderId: order.id,
            paymentId: successfulPayment.id,
            paymentMethod: formattedMethod,
            paymentDetails: successfulPayment,
            reconciledStatus: 'RECONCILED_AUTO',
            notes: `Auto-synced via Razorpay API by ${admin.name || admin.email}. Payment ID: ${successfulPayment.id} (₹${paidRupees}).`
          })

          reconciledCount++
          reconciledOrders.push({
            id: order.id,
            campaign: order.offerLink.title,
            amount: Number(order.amount),
            paymentId: successfulPayment.id,
            devoteeName: order.devotees[0]?.name || 'Devotee',
            method: formattedMethod
          })
        }
      } catch (err: any) {
        console.warn(`[Sync Razorpay] Error fetching payments for order ${order.id} (${rzpOrderId}):`, err.message)
      }
    }

    // Record Reconciliation Run Log
    if (reconciledCount > 0) {
      await prisma.reconciliationRun.create({
        data: {
          fileName: 'Direct Razorpay API Sync',
          gatewayType: 'RAZORPAY_API',
          totalProcessed: pendingOrders.length,
          totalMatched: reconciledCount,
          totalDiscrepant: 0
        }
      }).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${pendingOrders.length} pending order(s). Successfully reconciled ${reconciledCount} order(s).`,
      checkedCount: pendingOrders.length,
      reconciledCount,
      reconciledOrders
    })
  } catch (err) {
    return handleApiError(err)
  }
}
