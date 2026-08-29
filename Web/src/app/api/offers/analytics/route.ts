import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { handleApiError } from '@/libs/api-auth'

// POST /api/offers/analytics - Log visitor page view
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { offerLinkId } = body

    if (!offerLinkId) {
      return NextResponse.json({ error: 'Missing offerLinkId.' }, { status: 400 })
    }

    const offer = await prisma.offerLink.findUnique({ where: { id: offerLinkId } })
    if (!offer) {
      return NextResponse.json({ error: 'Offer Link not found.' }, { status: 404 })
    }

    const cfIp = req.headers.get('cf-connecting-ip')
    const realIp = req.headers.get('x-real-ip')
    const forwarded = req.headers.get('x-forwarded-for')
    const ipAddress = (cfIp || realIp || (forwarded ? forwarded.split(',')[0] : '127.0.0.1')).trim()
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    const visit = await prisma.offerLinkAnalytics.create({
      data: {
        offerLinkId,
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json({ success: true, visitId: visit.id })
  } catch (err) {
    return handleApiError(err)
  }
}
