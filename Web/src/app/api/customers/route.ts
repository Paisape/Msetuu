import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/customers — admin-only directory of registered customers with aggregate order
// counts and lifetime spend (sum of their PAID invoices).
export async function GET() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })

    const customers = await Promise.all(
      users.map(async user => {
        const [chadhava, epuja, jyotish, kundli, ecommerce, yatra, spendAgg] = await Promise.all([
          prisma.chadhavaOrder.count({ where: { userId: user.id } }),
          prisma.pujaOrder.count({ where: { userId: user.id } }),
          prisma.consultationBooking.count({ where: { userId: user.id } }),
          prisma.kundliOrder.count({ where: { userId: user.id } }),
          prisma.productOrder.count({ where: { userId: user.id } }),
          prisma.yatraBooking.count({ where: { userId: user.id } }),
          prisma.invoice.aggregate({ where: { userId: user.id, status: 'PAID' }, _sum: { total: true } })
        ])

        return {
          ...user,
          orderCount: chadhava + epuja + jyotish + kundli + ecommerce + yatra,
          totalSpend: spendAgg._sum.total || 0
        }
      })
    )

    return NextResponse.json(customers)
  } catch (err) {
    return handleApiError(err)
  }
}
