import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string; packageId: string }> }

// PATCH /api/epuja/listings/[id]/packages/[packageId] — admin edits a package's type/price
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id, packageId } = await params
    const body = await req.json()
    const { type, price, offerPrice, gstPercentage, gstInclusive } = body

    const existing = await prisma.pujaPackage.findUnique({ where: { id: packageId } })

    if (!existing || existing.pujaListingId !== id) {
      return NextResponse.json({ error: 'Package not found for this listing.' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}

    if (type !== undefined) data.type = type
    if (gstPercentage !== undefined) data.gstPercentage = gstPercentage === null ? 0 : Number(gstPercentage)
    if (gstInclusive !== undefined) data.gstInclusive = Boolean(gstInclusive)

    if (offerPrice !== undefined) {
      if (offerPrice !== null && (typeof offerPrice !== 'number' || offerPrice <= 0)) {
        return NextResponse.json({ error: 'offerPrice must be a positive number when provided.' }, { status: 400 })
      }

      data.offerPrice = offerPrice === null ? null : Number(offerPrice)
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json({ error: 'price must be a positive number.' }, { status: 400 })
      }

      data.price = price
    }

    const pkg = await prisma.pujaPackage.update({ where: { id: packageId }, data })

    return NextResponse.json(pkg)
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/epuja/listings/[id]/packages/[packageId] — admin removes a package.
// Blocked if orders already reference it, since PujaOrder.pujaPackage cascades on delete
// and we don't want removing a package to silently wipe out existing customer orders.
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id, packageId } = await params

    const existing = await prisma.pujaPackage.findUnique({
      where: { id: packageId },
      include: { _count: { select: { orders: true } } }
    })

    if (!existing || existing.pujaListingId !== id) {
      return NextResponse.json({ error: 'Package not found for this listing.' }, { status: 404 })
    }

    if (existing._count.orders > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${existing._count.orders} order(s) reference this package.` },
        { status: 409 }
      )
    }

    await prisma.pujaPackage.delete({ where: { id: packageId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
