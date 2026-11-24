import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { enforceRateLimit } from '@/libs/rateLimit'
import { getContaboConfig, keyFromObjectUrl, presignGet } from '@/libs/contaboStorage'
import { extractFileId, VIDEO_DOWNLOAD_NOTE } from '@/libs/videoUpload'
import { logOrderTrail, OrderType } from '@/libs/orderTrail'

const normalizeWords = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length >= 2)

const NOT_MATCHED = 'Order ID and name do not match.'

/**
 * Checks if the user-entered name matches the devotee name.
 * Handles single names, first names, full names, honorifics (e.g. Pandit/Shri/Dr),
 * and substring matches, while preventing 1-character false positives.
 */
function isNameMatching(registeredName: string, enteredName: string): boolean {
  const regWords = normalizeWords(registeredName)
  const entWords = normalizeWords(enteredName)

  if (regWords.length === 0 || entWords.length === 0) return false

  // 1. Direct first word match
  if (regWords[0] === entWords[0]) return true

  // 2. Any entered word matches any registered word (e.g. "Ramesh" in "Pandit Ramesh Sharma")
  const hasWordMatch = entWords.some(ew => regWords.includes(ew))
  if (hasWordMatch) return true

  // 3. Substring match if entered term is at least 3 chars (e.g. "priya" in "priyadarshini")
  const regFull = regWords.join(' ')
  const entFull = entWords.join(' ')
  if (entFull.length >= 3 && (regFull.includes(entFull) || entFull.includes(regFull))) {
    return true
  }

  return false
}

// Finds the order's video, verifying the typed name against the devotee name(s).
// Not-found and wrong-name give the same answer so the endpoint can't be used to probe order IDs.
async function findVideo(rawId: string, rawName: string): Promise<{ id: string; type: OrderType; status: string; videoUrl: string } | null> {
  const entWords = normalizeWords(rawName)
  const ref = rawId.replace(/^[#\s]*(MS\s*[-_]?|ORD\s*[-_]?)/i, '').replace(/[^a-zA-Z0-9-]/g, '')

  if (entWords.length === 0 || ref.length < 6) return null

  const where = { id: { startsWith: ref, mode: 'insensitive' as const } }

  const [campaign, offer, chadhava, puja] = await Promise.all([
    prisma.offerLinkOrder.findMany({
      where,
      include: {
        devotees: { select: { name: true, nameLocal: true } }
      },
      take: 5
    }),
    prisma.offerOrder.findMany({ where, take: 5 }),
    prisma.chadhavaOrder.findMany({ where, take: 5 }),
    prisma.pujaOrder.findMany({ where, take: 5 })
  ])

  const candidates: { id: string; type: OrderType; status: string; names: string[]; videoUrl: string | null }[] = [
    ...campaign.map((o: any) => ({
      id: o.id,
      type: 'OFFER' as const,
      status: 'COMPLETED',
      names: (o.devotees || []).flatMap((d: any) => [d.name, d.nameLocal]).filter(Boolean),
      videoUrl: o.videoUrl
    })),
    ...offer.map((o: any) => {
      const extraNames: string[] = []
      if (Array.isArray(o.devotees)) {
        extraNames.push(...o.devotees.map((d: any) => d.name).filter(Boolean))
      }
      return {
        id: o.id,
        type: 'OFFER' as const,
        status: o.status,
        names: [o.name, ...extraNames].filter(Boolean),
        videoUrl: o.videoUrl
      }
    }),
    ...chadhava.map((o: any) => {
      const extraNames: string[] = []
      if (Array.isArray(o.persons)) {
        extraNames.push(...o.persons.map((p: any) => p.name).filter(Boolean))
      }
      return {
        id: o.id,
        type: 'CHADHAVA' as const,
        status: o.status,
        names: [o.name, ...extraNames].filter(Boolean),
        videoUrl: o.videoUrl
      }
    }),
    ...puja.map((o: any) => {
      const extraNames: string[] = []
      if (Array.isArray(o.devotees)) {
        extraNames.push(...o.devotees.map((d: any) => d.name).filter(Boolean))
      }
      return {
        id: o.id,
        type: 'EPUJA' as const,
        status: o.status,
        names: [o.name, ...extraNames].filter(Boolean),
        videoUrl: o.videoUrl
      }
    })
  ]

  const match = candidates.find(c =>
    c.videoUrl && c.names.some(registeredName => isNameMatching(registeredName, rawName))
  )

  return match ? { id: match.id, type: match.type, status: match.status, videoUrl: match.videoUrl as string } : null
}

// Checks the details; the page then navigates to GET below to start the download.
export async function POST(req: Request) {
  const rateLimited = enforceRateLimit(req, 'order-video', { limit: 20, windowMs: 15 * 60 * 1000 })
  if (rateLimited) return rateLimited

  const { id, name } = await req.json().catch(() => ({}))
  const found = await findVideo(String(id || ''), String(name || ''))

  if (!found) return NextResponse.json({ error: NOT_MATCHED }, { status: 403 })

  return NextResponse.json({
    downloadUrl: `/api/orders/video?id=${encodeURIComponent(String(id))}&name=${encodeURIComponent(String(name))}`
  })
}

export async function GET(req: Request) {
  const rateLimited = enforceRateLimit(req, 'order-video', { limit: 20, windowMs: 15 * 60 * 1000 })
  if (rateLimited) return rateLimited

  const { searchParams } = new URL(req.url)
  const found = await findVideo(searchParams.get('id') || '', searchParams.get('name') || '')

  if (!found) return NextResponse.json({ error: NOT_MATCHED }, { status: 403 })

  // Recorded when the download starts; the report in the admin panel reads these rows.
  await logOrderTrail({
    orderType: found.type,
    orderId: found.id,
    status: found.status,
    note: VIDEO_DOWNLOAD_NOTE,
    actorRole: 'USER',
    req
  }).catch(err => console.error('[Video download] could not log download:', err))

  const config = await getContaboConfig()
  const key = config && keyFromObjectUrl(config, found.videoUrl)
  const shortId = found.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()

  // Our own storage: send the customer to a short-lived download link, so the video bytes never pass through this server.
  if (config && key) {
    const ext = key.split('.').pop() || 'mp4'
    return NextResponse.redirect(presignGet(config, key, 15 * 60, `MS-${shortId}.${ext}`))
  }

  // Older videos kept on Google Drive: fetched here and passed on, so the customer never sees Drive.
  const driveId = extractFileId(found.videoUrl)

  if (driveId) {
    const upstream = await fetch(`https://drive.google.com/uc?export=download&confirm=t&id=${driveId}`)
    const type = upstream.headers.get('content-type') || ''

    if (!upstream.ok || !upstream.body || type.includes('text/html')) {
      return NextResponse.json({ error: 'Video is temporarily unavailable. Please try again later.' }, { status: 502 })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': type || 'video/mp4',
        'Content-Disposition': `attachment; filename="MS-${shortId}.mp4"`,
        ...(upstream.headers.get('content-length') ? { 'Content-Length': upstream.headers.get('content-length') as string } : {})
      }
    })
  }

  return NextResponse.json({ error: 'Video is not available.' }, { status: 404 })
}
