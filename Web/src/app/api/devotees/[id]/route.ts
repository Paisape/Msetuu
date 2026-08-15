import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = {
  params: Promise<{ id: string }>
}

// GET /api/devotees/[id] - Admin-only endpoint to get devotee details and their orders history
export async function GET(req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params

    const devotee = await prisma.offerLinkDevotee.findUnique({
      where: { id }
    })

    if (!devotee) {
      return NextResponse.json({ error: 'Devotee not found.' }, { status: 404 })
    }

    // Find all completed orders where a devotee has the same phone number
    const orders = await prisma.offerLinkOrder.findMany({
      where: {
        devotees: {
          some: {
            phone: devotee.phone
          }
        },
        paymentStatus: 'SUCCESS'
      },
      include: {
        devotees: true,
        offerLink: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ devotee, orders })
  } catch (err) {
    return handleApiError(err)
  }
}
