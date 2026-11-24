import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getContaboConfig, listObjects, deleteObject, objectUrl, ListedObject } from '@/libs/contaboStorage'
import { ensureOfferLinkOrderVideoColumns } from '@/libs/videoUpload'

export const maxDuration = 300

const istDate = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
const DRIVE = { videoUrl: { contains: 'drive.google.com' } }
const folderOf = (key: string) => key.slice(0, key.lastIndexOf('/'))

// Stored videos grouped by folder and upload date, so a whole day's batch can be reviewed and removed.
export async function GET() {
  try {
    await requireAdmin()
    const config = await getContaboConfig()

    if (!config) {
      return NextResponse.json({ success: false, error: 'Contabo S3 credentials are not configured.' }, { status: 500 })
    }

    const groups = new Map<string, { source: 'contabo' | 'drive'; folder: string; date: string; count: number; totalBytes: number }>()

    for (const obj of await listObjects(config, 'videos/')) {
      const folder = folderOf(obj.key)
      const date = istDate(obj.lastModified)
      const id = `${folder}|${date}`
      const group = groups.get(id) || { source: 'contabo' as const, folder, date, count: 0, totalBytes: 0 }

      group.count++
      group.totalBytes += obj.size
      groups.set(id, group)
    }

    // Older videos that only exist as Google Drive links on orders (nothing is stored in our bucket).
    await ensureOfferLinkOrderVideoColumns()
    const select = { videoUploadedAt: true }
    const driveRows: { videoUploadedAt: Date | null }[] = (
      await Promise.all<{ videoUploadedAt: Date | null }[]>([
        (prisma.offerLinkOrder as any).findMany({ where: DRIVE, select }),
        prisma.chadhavaOrder.findMany({ where: DRIVE, select }),
        prisma.pujaOrder.findMany({ where: DRIVE, select })
      ])
    ).flat()

    for (const row of driveRows) {
      if (!row.videoUploadedAt) continue
      const date = istDate(new Date(row.videoUploadedAt).toISOString())
      const id = `drive|${date}`
      const group = groups.get(id) || { source: 'drive' as const, folder: 'Google Drive', date, count: 0, totalBytes: 0 }

      group.count++
      groups.set(id, group)
    }

    const today = istDate(new Date().toISOString())
    const dayMs = 24 * 3600 * 1000

    const list = Array.from(groups.values())
      .map(g => ({ ...g, ageDays: Math.round((Date.parse(today) - Date.parse(g.date)) / dayMs) }))
      .sort((a, b) => b.date.localeCompare(a.date) || a.folder.localeCompare(b.folder))

    return NextResponse.json({ success: true, groups: list })
  } catch (err) {
    return handleApiError(err)
  }
}

// Manual delete of one batch (all videos in a folder uploaded on one date). Only runs when an admin clicks Delete.
export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin()
    const config = await getContaboConfig()

    if (!config) {
      return NextResponse.json({ success: false, error: 'Contabo S3 credentials are not configured.' }, { status: 500 })
    }

    const body = await req.json()
    const folder = String(body.folder || '').replace(/\/+$/, '')
    const date = String(body.date || '')

    if (body.source === 'drive') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ success: false, error: 'Invalid date.' }, { status: 400 })
      }

      // Drive files can't be deleted from here; this only removes the link from the orders.
      const start = new Date(`${date}T00:00:00+05:30`)
      const where = { ...DRIVE, videoUploadedAt: { gte: start, lt: new Date(start.getTime() + 24 * 3600 * 1000) } }
      const data = { videoUrl: null, videoExpired: true }

      await ensureOfferLinkOrderVideoColumns()
      const results = await Promise.all([
        (prisma.offerLinkOrder as any).updateMany({ where, data }),
        prisma.chadhavaOrder.updateMany({ where, data }),
        prisma.pujaOrder.updateMany({ where, data })
      ])

      return NextResponse.json({ success: true, deleted: results.reduce((n: number, r: { count: number }) => n + r.count, 0) })
    }

    if (!folder.startsWith('videos/') || folder.includes('..') || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'Invalid folder or date.' }, { status: 400 })
    }

    const batch: ListedObject[] = (await listObjects(config, `${folder}/`)).filter(
      o => folderOf(o.key) === folder && istDate(o.lastModified) === date
    )

    if (batch.length === 0) {
      return NextResponse.json({ success: false, error: 'No videos found for this batch (already deleted?).' }, { status: 404 })
    }

    for (const obj of batch) {
      await deleteObject(config, obj.key)
    }

    // Orders pointing at the deleted files would show a broken video, so mark them as removed.
    const urls = batch.map(o => objectUrl(config, o.key))
    const data = { videoUrl: null, videoExpired: true }

    await ensureOfferLinkOrderVideoColumns()
    for (let i = 0; i < urls.length; i += 500) {
      const where = { videoUrl: { in: urls.slice(i, i + 500) } }

      await Promise.all([
        (prisma.offerLinkOrder as any).updateMany({ where, data }),
        prisma.chadhavaOrder.updateMany({ where, data }),
        prisma.pujaOrder.updateMany({ where, data })
      ])
    }

    console.log(`[Contabo] ${admin.id} deleted ${batch.length} videos from ${folder} (${date})`)

    return NextResponse.json({ success: true, deleted: batch.length })
  } catch (err) {
    return handleApiError(err)
  }
}
