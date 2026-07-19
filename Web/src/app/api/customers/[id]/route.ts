import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/customers/[id] — admin-only customer profile + every order they've placed across
// all 6 modules, so admin can see everything about one customer in one place.
export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, createdAt: true }
    })

    if (!user) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

    const [chadhava, epuja, jyotish, kundli, ecommerce, yatra, invoices] = await Promise.all([
      prisma.chadhavaOrder.findMany({ where: { userId: id }, include: { chadhavaListing: true }, orderBy: { createdAt: 'desc' } }),
      prisma.pujaOrder.findMany({ where: { userId: id }, include: { pujaListing: true, pujaPackage: true }, orderBy: { createdAt: 'desc' } }),
      prisma.consultationBooking.findMany({ where: { userId: id }, include: { astrologer: true }, orderBy: { createdAt: 'desc' } }),
      prisma.kundliOrder.findMany({ where: { userId: id }, include: { kundliListing: true }, orderBy: { createdAt: 'desc' } }),
      prisma.productOrder.findMany({ where: { userId: id }, include: { product: true }, orderBy: { createdAt: 'desc' } }),
      prisma.yatraBooking.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.invoice.findMany({ where: { userId: id }, orderBy: { issuedAt: 'desc' } })
    ])

    const orders = [
      ...chadhava.map(o => ({ type: 'chadhava', id: o.id, label: o.chadhavaListing.title, amount: o.amountPaid, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
      ...epuja.map(o => ({ type: 'epuja', id: o.id, label: `${o.pujaListing.title} (${o.pujaPackage.type})`, amount: o.amountPaid, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
      ...jyotish.map(o => ({ type: 'jyotish', id: o.id, label: `${o.category} consultation`, amount: null, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
      ...kundli.map(o => ({ type: 'kundli', id: o.id, label: o.kundliType, amount: o.amountPaid, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
      ...ecommerce.map(o => ({ type: 'ecommerce', id: o.id, label: o.product.name, amount: o.totalAmount, status: o.status, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
      ...yatra.map(o => ({ type: 'yatra', id: o.id, label: o.yatraDestination, amount: null, status: o.status, paymentStatus: null, createdAt: o.createdAt }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const totalSpend = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.total, 0)

    return NextResponse.json({ user, orders, invoices, totalSpend, orderCount: orders.length })
  } catch (err) {
    return handleApiError(err)
  }
}
