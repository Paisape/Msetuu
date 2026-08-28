import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

export async function POST(req: Request) {
  try {
    // 1. Authenticate user and verify ADMIN role
    const authUser = await requireUser()
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required to purge orders.' }, { status: 403 })
    }

    const body = await req.json()
    const { confirmationPassword } = body || {}

    // Verify password confirmation safeguard
    if (confirmationPassword !== 'GO_LIVE_PURGE_2026') {
      return NextResponse.json({ 
        error: 'Confirmation string mismatch. Send confirmationPassword: "GO_LIVE_PURGE_2026" to execute purge.' 
      }, { status: 400 })
    }

    // 2. Perform cascade delete of all test orders, test invoices, audit records, and test customer accounts (role: USER)
    const results = await prisma.$transaction([
      prisma.orderTrail.deleteMany({}),
      prisma.refund.deleteMany({}),
      prisma.invoice.deleteMany({}),
      prisma.offerOrder.deleteMany({}),
      prisma.offerLinkOrder.deleteMany({}),
      prisma.chadhavaOrder.deleteMany({}),
      prisma.pujaOrder.deleteMany({}),
      prisma.consultationBooking.deleteMany({}),
      prisma.kundliOrder.deleteMany({}),
      prisma.productOrder.deleteMany({}),
      prisma.yatraBooking.deleteMany({}),
      prisma.user.deleteMany({ where: { role: 'USER' } })
    ])

    const summary = {
      orderTrailCount: results[0].count,
      refundCount: results[1].count,
      invoiceCount: results[2].count,
      offerOrderCount: results[3].count,
      offerLinkOrderCount: results[4].count,
      chadhavaOrderCount: results[5].count,
      pujaOrderCount: results[6].count,
      consultationBookingCount: results[7].count,
      kundliOrderCount: results[8].count,
      productOrderCount: results[9].count,
      yatraBookingCount: results[10].count,
      testCustomersCount: results[11].count
    }

    return NextResponse.json({
      success: true,
      message: 'All test orders, invoices, and audit records have been permanently purged for production live launch.',
      purged: summary
    })
  } catch (err: any) {
    return handleApiError(err)
  }
}
