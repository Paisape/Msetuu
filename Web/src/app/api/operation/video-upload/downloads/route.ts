import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { ensureOfferLinkOrderVideoColumns, VIDEO_DOWNLOAD_NOTE } from '@/libs/videoUpload'

// Which customers downloaded their video and which have not, for the most recent uploads.
export async function GET() {
  try {
    await requireAdmin()
    await ensureOfferLinkOrderVideoColumns()

    const where = { videoUploadedAt: { not: null } }
    const select = { id: true, videoUploadedAt: true, videoExpired: true }
    const take = 500
    const orderBy = { videoUploadedAt: 'desc' as const }

    const [campaign, chadhava, puja] = await Promise.all([
      (prisma.offerLinkOrder as any).findMany({
        where,
        orderBy,
        take,
        select: { ...select, devotees: { where: { isPrimary: true }, take: 1, select: { name: true } } }
      }),
      (prisma.chadhavaOrder as any).findMany({ where, orderBy, take, select: { ...select, name: true } }),
      (prisma.pujaOrder as any).findMany({ where, orderBy, take, select: { ...select, name: true } })
    ])

    const rows = [
      ...campaign.map((o: any) => ({ ...o, category: 'Campaign', name: o.devotees?.[0]?.name || '' })),
      ...chadhava.map((o: any) => ({ ...o, category: 'Chadhava' })),
      ...puja.map((o: any) => ({ ...o, category: 'E-Puja' }))
    ].sort((a, b) => new Date(b.videoUploadedAt).getTime() - new Date(a.videoUploadedAt).getTime())

    const trails = await prisma.orderTrail.findMany({
      where: { note: VIDEO_DOWNLOAD_NOTE, orderId: { in: rows.map(r => r.id) } },
      select: { orderId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })

    const downloads = new Map<string, { count: number; last: Date }>()

    for (const t of trails) {
      const entry = downloads.get(t.orderId)

      if (entry) entry.count++
      else downloads.set(t.orderId, { count: 1, last: t.createdAt })
    }

    const items = rows.map(r => {
      const d = downloads.get(r.id)

      return {
        orderId: r.id,
        shortId: r.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase(),
        category: r.category,
        name: r.name || '—',
        uploadedAt: r.videoUploadedAt,
        deleted: !!r.videoExpired,
        downloaded: !!d,
        downloadCount: d?.count || 0,
        lastDownloadAt: d?.last || null
      }
    })

    return NextResponse.json({ success: true, items })
  } catch (err) {
    return handleApiError(err)
  }
}
