import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { handleApiError } from '@/libs/api-auth'
import { getRequestInfo } from '@/libs/request-info'

// GET /api/offer/[slug] — Public endpoint to load an offer landing page details
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const offer = await prisma.offer.findUnique({
      where: { slug }
    })

    if (!offer || !offer.active) {
      return NextResponse.json({ error: 'This special offer is not active or does not exist.' }, { status: 404 })
    }

    return NextResponse.json(offer)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/offer/[slug] — Public endpoint to track a visit (background/non-blocking request)
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const offer = await prisma.offer.findUnique({ where: { slug } })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 })
    }

    const { ip, userAgent } = getRequestInfo(req)
    const referrer = req.headers.get('referer') || req.headers.get('referrer')

    // Create the visit log and increment visitsCount atomically
    await prisma.$transaction([
      prisma.offerVisit.create({
        data: {
          offerId: offer.id,
          ipAddress: ip,
          userAgent,
          referrer
        }
      }),
      prisma.offer.update({
        where: { id: offer.id },
        data: { visitsCount: { increment: 1 } }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
