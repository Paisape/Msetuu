import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

export async function GET() {
  try {
    const user = await requireUser()
    const orders = await prisma.productOrder.findMany({
      where: { userId: user.id },
      select: { shippingAddress: true },
      distinct: ['shippingAddress']
    })
    const addresses = orders.map(o => o.shippingAddress).filter(Boolean)
    return NextResponse.json(addresses)
  } catch (err) {
    return handleApiError(err)
  }
}
