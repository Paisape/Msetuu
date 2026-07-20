import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/dashboard/summary — admin-only counts for the Mandirsetuu dashboard landing page.
export async function GET() {
  try {
    await requireAdmin()

    const [
      chadhava,
      epuja,
      jyotish,
      kundli,
      ecommerce,
      yatra,
      chadhavaPending,
      epujaPending,
      jyotishPending,
      kundliPending,
      ecommercePending,
      yatraPending,
      customers,
      revenueAgg,
      refundsPending
    ] = await Promise.all([
      prisma.chadhavaOrder.count(),
      prisma.pujaOrder.count(),
      prisma.consultationBooking.count(),
      prisma.kundliOrder.count(),
      prisma.productOrder.count(),
      prisma.yatraBooking.count(),
      prisma.chadhavaOrder.count({ where: { status: 'PENDING' } }),
      prisma.pujaOrder.count({ where: { status: 'PENDING' } }),
      prisma.consultationBooking.count({ where: { status: 'PENDING' } }),
      prisma.kundliOrder.count({ where: { status: 'PENDING' } }),
      prisma.productOrder.count({ where: { status: 'PENDING' } }),
      prisma.yatraBooking.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
      prisma.refund.count({ where: { status: 'INITIATED' } })
    ])

    return NextResponse.json({
      modules: [
        { key: 'chadhava', label: 'Chadhava Orders', total: chadhava, pending: chadhavaPending, href: '/apps/mandir-setu/orders/chadhava' },
        { key: 'epuja', label: 'E-Puja Orders', total: epuja, pending: epujaPending, href: '/apps/mandir-setu/orders/epuja' },
        { key: 'jyotish', label: 'Jyotish Consultations', total: jyotish, pending: jyotishPending, href: '/apps/mandir-setu/orders/jyotish' },
        { key: 'kundli', label: 'Kundli Requests', total: kundli, pending: kundliPending, href: '/apps/mandir-setu/orders/kundli' },
        { key: 'ecommerce', label: 'Ecommerce Orders', total: ecommerce, pending: ecommercePending, href: '/apps/mandir-setu/orders/ecommerce' },
        { key: 'yatra', label: 'Yatra Orders', total: yatra, pending: yatraPending, href: '/apps/mandir-setu/orders/yatra' }
      ],
      customers,
      totalRevenue: revenueAgg._sum.total || 0,
      refundsPending
    })
  } catch (err) {
    return handleApiError(err)
  }
}
