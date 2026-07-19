import prisma from '@/libs/prisma'
import { getRequestInfo } from '@/libs/request-info'

export type OrderType = 'CHADHAVA' | 'EPUJA' | 'JYOTISH' | 'KUNDLI' | 'ECOMMERCE' | 'YATRA' | 'OFFER'

type LogOrderTrailInput = {
  orderType: OrderType
  orderId: string
  status: string
  note?: string
  actorId?: string | null
  actorRole?: 'ADMIN' | 'SYSTEM' | 'USER'
  req?: Request
}

// Appends one row to the uniform status/audit trail shared by every order type. Call this
// on order creation and on every subsequent status change so both the customer (status only)
// and the admin (status + ip/userAgent + actor) have a consistent history to look at.
export async function logOrderTrail({ orderType, orderId, status, note, actorId, actorRole, req }: LogOrderTrailInput) {
  const { ip, userAgent } = req ? getRequestInfo(req) : { ip: null, userAgent: null }

  await prisma.orderTrail.create({
    data: {
      orderType,
      orderId,
      status,
      note,
      actorId: actorId ?? null,
      actorRole: actorRole ?? (actorId ? 'ADMIN' : 'SYSTEM'),
      ip,
      userAgent
    }
  })
}
