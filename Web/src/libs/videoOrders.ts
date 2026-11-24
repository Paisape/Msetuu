import prisma from '@/libs/prisma'
import { ensureOfferLinkOrderVideoColumns } from '@/libs/videoUpload'

export type VideoOrderType = 'CAMPAIGN' | 'CHADHAVA' | 'EPUJA'

export const CATEGORY_FOLDER: Record<VideoOrderType, string> = {
  CAMPAIGN: 'campaign',
  CHADHAVA: 'chadhava',
  EPUJA: 'puja'
}

export type ResolvedVideoOrder = {
  order: any
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  userId: string | null
  itemLabel: string
  orderStatus: string
}

type ResolveResult = { ok: true; data: ResolvedVideoOrder } | { ok: false; status: number; error: string }

export function normalizeOrderType(value: unknown): VideoOrderType {
  return value === 'CHADHAVA' || value === 'EPUJA' ? value : 'CAMPAIGN'
}

// Filename or typed value -> bare ID. "MS-7EB64E6A.mp4", "#7eb64e6a" and the full ID all work.
export function cleanOrderRef(raw: string): string {
  return raw
    .replace(/\.[^./\\]+$/, '')
    .replace(/^[#\s]*(MS[-_]?|ORD[-_]?)/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .trim()
}

/**
 * Finds the one order a short or full ID belongs to inside the chosen category.
 * A short ID that matches more than one order is rejected instead of guessing.
 */
export async function resolveVideoOrder(orderType: VideoOrderType, rawRef: string): Promise<ResolveResult> {
  const ref = cleanOrderRef(rawRef)

  if (ref.length < 6) {
    return { ok: false, status: 400, error: `"${rawRef}" is not a valid Order ID.` }
  }

  let model: any
  let include: any

  if (orderType === 'CAMPAIGN') {
    await ensureOfferLinkOrderVideoColumns()
    model = prisma.offerLinkOrder
    include = { offerLink: true, devotees: { orderBy: { isPrimary: 'desc' as const } } }
  } else if (orderType === 'CHADHAVA') {
    model = prisma.chadhavaOrder
    include = { user: { select: { name: true, email: true, phone: true } }, chadhavaListing: true }
  } else {
    model = prisma.pujaOrder
    include = { user: { select: { name: true, email: true, phone: true } }, pujaListing: true, pujaPackage: true }
  }

  let matches: any[] = await model.findMany({
    where: { id: { equals: ref, mode: 'insensitive' } },
    include,
    take: 1
  })

  if (matches.length === 0) {
    matches = await model.findMany({
      where: { id: { startsWith: ref, mode: 'insensitive' } },
      include,
      take: 2
    })
  }

  if (matches.length === 0) {
    return { ok: false, status: 404, error: `No ${CATEGORY_FOLDER[orderType]} order found for "${rawRef}".` }
  }

  if (matches.length > 1) {
    return { ok: false, status: 409, error: `"${rawRef}" matches more than one order. Use the full Order ID.` }
  }

  const order = matches[0]

  if (orderType === 'CAMPAIGN') {
    const primary = order.devotees?.find((d: any) => d.isPrimary) || order.devotees?.[0]

    return {
      ok: true,
      data: {
        order,
        customerName: primary?.name || 'Devotee',
        customerEmail: primary?.email || null,
        customerPhone: primary?.phone || null,
        userId: null,
        itemLabel: order.offerLink?.title || 'Campaign Offering',
        orderStatus: order.paymentStatus === 'SUCCESS' ? 'CONFIRMED' : order.paymentStatus
      }
    }
  }

  return {
    ok: true,
    data: {
      order,
      customerName: order.user?.name || 'Devotee',
      customerEmail: order.user?.email || null,
      customerPhone: order.user?.phone || null,
      userId: order.userId || null,
      itemLabel: (orderType === 'CHADHAVA' ? order.chadhavaListing?.title : order.pujaListing?.title) || 'Offering',
      orderStatus: order.status || 'CONFIRMED'
    }
  }
}

export const ALLOWED_VIDEO_EXTS: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  m4v: 'video/x-m4v'
}

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024

// Checks the real file header so a renamed non-video file can't get through.
export function hasVideoSignature(ext: string, head: Buffer): boolean {
  if (head.length < 12) return false
  if (ext === 'mp4' || ext === 'mov' || ext === 'm4v') {
    return ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(head.toString('latin1', 4, 8))
  }
  if (ext === 'webm' || ext === 'mkv') return head.readUInt32BE(0) === 0x1a45dfa3
  if (ext === 'avi') return head.toString('latin1', 0, 4) === 'RIFF' && head.toString('latin1', 8, 12) === 'AVI '
  return false
}
