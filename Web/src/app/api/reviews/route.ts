import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, requireAdmin, handleApiError } from '@/libs/api-auth'

const MAX_COMMENT_LEN = 1000
const VALID_ORDER_TYPES = new Set(['CHADHAVA', 'EPUJA', 'KUNDLI', 'JYOTISH', 'ECOMMERCE'])
const MAX_MEDIA_ITEMS = 5
const VALID_MEDIA_TYPES = new Set(['image', 'video'])

// Media URLs must point at files this app itself wrote via /api/upload/review-media — never
// trust an arbitrary client-supplied URL here (blocks hot-linking external/malicious content
// into a review).
const REVIEW_MEDIA_URL_PREFIX = '/uploads/reviews/'

// Validates the client-submitted `media` array server-side: caps count, checks shape, and
// rejects any URL that didn't come from our own review-media uploader. Returns `null` (meaning
// "no media") for anything malformed rather than throwing, since media is optional.
function sanitizeMedia(input: unknown): { url: string; type: string }[] | null {
  if (!Array.isArray(input) || input.length === 0) return null

  const sanitized = input
    .slice(0, MAX_MEDIA_ITEMS)
    .filter(
      (item): item is { url: string; type: string } =>
        item &&
        typeof item === 'object' &&
        typeof item.url === 'string' &&
        item.url.startsWith(REVIEW_MEDIA_URL_PREFIX) &&
        typeof item.type === 'string' &&
        VALID_MEDIA_TYPES.has(item.type)
    )
    .map(item => ({ url: item.url, type: item.type }))

  return sanitized.length > 0 ? sanitized : null
}

const MAX_RECENT_LIMIT = 20

// GET /api/reviews
//   ?all=1                          — admin only, every review (any status) for moderation
//   ?recent=1&limit=N               — public, latest APPROVED reviews across every module (any
//                                     orderType/target) — used for site-wide "What people say"
//                                     style sections rather than one specific listing's reviews
//   ?orderType=X&orderId=Y          — the logged-in user's own review for that specific order
//                                     (used to show "you already reviewed this" on My Orders)
//   ?orderType=X&targetId=Y         — public, APPROVED reviews for a listing/product/astrologer,
//                                     plus the average rating and count
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const wantsAll = params.get('all') === '1'
    const wantsRecent = params.get('recent') === '1'
    const orderType = params.get('orderType')
    const orderId = params.get('orderId')
    const targetId = params.get('targetId')

    if (wantsAll) {
      await requireAdmin()

      const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } })

      return NextResponse.json(reviews)
    }

    if (wantsRecent) {
      const limitParam = Number(params.get('limit'))
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_RECENT_LIMIT) : 8

      const reviews = await prisma.review.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return NextResponse.json(reviews)
    }

    if (orderType && orderId) {
      const user = await requireUser()

      const review = await prisma.review.findUnique({
        where: { userId_orderType_orderId: { userId: user.id, orderType, orderId } }
      })

      return NextResponse.json({ review })
    }

    if (orderType && targetId) {
      const reviews = await prisma.review.findMany({
        where: { orderType, targetId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' }
      })

      const count = reviews.length
      const averageRating = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0

      return NextResponse.json({ reviews, averageRating, count })
    }

    return NextResponse.json({ error: 'orderType and either orderId or targetId are required.' }, { status: 400 })
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/reviews — logged-in user submits a review for one of their own PAID orders
// (verified purchase). The order is looked up server-side; nothing about the target listing,
// its title, or the reviewer's identity is trusted from the request body.
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const { orderType, orderId, rating, comment, media } = body

    if (!orderType || !VALID_ORDER_TYPES.has(orderType) || !orderId) {
      return NextResponse.json({ error: 'A valid orderType and orderId are required.' }, { status: 400 })
    }

    const parsedRating = Number(rating)

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'rating must be a whole number between 1 and 5.' }, { status: 400 })
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim().slice(0, MAX_COMMENT_LEN) : null
    const sanitizedMedia = sanitizeMedia(media)

    // Look up the order and derive targetId/targetTitle entirely server-side — this is what
    // makes the review a verified purchase rather than a self-reported claim.
    let order: any = null
    let targetId: string | null = null
    let targetTitle: string | null = null

    if (orderType === 'CHADHAVA') {
      order = await prisma.chadhavaOrder.findUnique({ where: { id: orderId }, include: { chadhavaListing: true } })
      targetId = order?.chadhavaListingId ?? null
      targetTitle = order?.chadhavaListing?.title ?? null
    } else if (orderType === 'EPUJA') {
      order = await prisma.pujaOrder.findUnique({ where: { id: orderId }, include: { pujaListing: true } })
      targetId = order?.pujaListingId ?? null
      targetTitle = order?.pujaListing?.title ?? null
    } else if (orderType === 'KUNDLI') {
      order = await prisma.kundliOrder.findUnique({ where: { id: orderId }, include: { kundliListing: true } })
      targetId = order?.kundliListingId ?? null
      targetTitle = order?.kundliListing?.title ?? order?.kundliType ?? null
    } else if (orderType === 'JYOTISH') {
      order = await prisma.consultationBooking.findUnique({ where: { id: orderId }, include: { astrologer: true } })
      targetId = order?.astrologerId ?? null
      targetTitle = order?.astrologer?.name ?? null
    } else if (orderType === 'ECOMMERCE') {
      order = await prisma.productOrder.findUnique({ where: { id: orderId }, include: { product: true } })
      targetId = order?.productId ?? null
      targetTitle = order?.product?.name ?? null
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'This order does not belong to you.' }, { status: 403 })
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'You can only review an order after payment is complete.' }, { status: 403 })
    }

    if (!targetId || !targetTitle) {
      return NextResponse.json({ error: 'This order has no reviewable item on record.' }, { status: 400 })
    }

    try {
      const review = await prisma.review.create({
        data: {
          userId: user.id,
          customerName: user.name || order.name || 'Customer',
          orderType,
          orderId,
          targetId,
          targetTitle,
          rating: parsedRating,
          comment: trimmedComment || null,
          media: sanitizedMedia ?? undefined,
          status: 'PENDING'
        }
      })

      return NextResponse.json(review, { status: 201 })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json({ error: 'You have already reviewed this order.' }, { status: 409 })
      }

      throw err
    }
  } catch (err) {
    return handleApiError(err)
  }
}
