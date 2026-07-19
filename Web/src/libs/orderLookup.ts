import prisma from '@/libs/prisma'
import type { OrderType } from '@/libs/orderTrail'

// Looks up which user owns a given order row, regardless of which of the 6 order tables it
// lives in. Used to authorize a customer's own trail/invoice requests (admins bypass this).
export async function getOrderOwnerId(orderType: OrderType, orderId: string): Promise<string | null> {
  switch (orderType) {
    case 'CHADHAVA': {
      const row = await prisma.chadhavaOrder.findUnique({ where: { id: orderId }, select: { userId: true } })

      return row?.userId ?? null
    }

    case 'EPUJA': {
      const row = await prisma.pujaOrder.findUnique({ where: { id: orderId }, select: { userId: true } })

      return row?.userId ?? null
    }

    case 'JYOTISH': {
      const row = await prisma.consultationBooking.findUnique({ where: { id: orderId }, select: { userId: true } })

      return row?.userId ?? null
    }

    case 'KUNDLI': {
      const row = await prisma.kundliOrder.findUnique({ where: { id: orderId }, select: { userId: true } })

      return row?.userId ?? null
    }

    case 'ECOMMERCE': {
      const row = await prisma.productOrder.findUnique({ where: { id: orderId }, select: { userId: true } })

      return row?.userId ?? null
    }

    case 'YATRA': {
      const row = await prisma.yatraBooking.findUnique({ where: { id: orderId }, select: { userId: true } })

      return row?.userId ?? null
    }

    default:
      return null
  }
}
