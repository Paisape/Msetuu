import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'
import { isValidDriveLink, parseDriveFolder } from '@/libs/videoUpload'
import { sendEmail } from '@/libs/email'
import { videoReadyEmail } from '@/libs/emailTemplates'

type BatchItemInput = { orderType: 'CHADHAVA' | 'EPUJA'; orderId: string; driveLink: string }

// GET /api/operation/video-upload — admin: batch history (most recent first)
export async function GET() {
  try {
    await requireAdmin()

    const batches = await prisma.videoUploadBatch.findMany({
      include: { items: { orderBy: { createdAt: 'asc' } }, createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(batches)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/operation/video-upload — admin: associate a batch of Google Drive links with
// orders by order ID. Supports either a single Drive folder mapping or manual list.
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()

    const body = await req.json()
    const mode = body?.mode // 'FOLDER' or 'MANUAL' (default 'MANUAL')
    
    let items: BatchItemInput[] = []

    if (mode === 'FOLDER') {
      const orderType = body?.orderType // 'CHADHAVA' or 'EPUJA'
      const folderLink = (body?.folderLink || '').trim()

      if (orderType !== 'CHADHAVA' && orderType !== 'EPUJA') {
        return NextResponse.json({ error: 'orderType must be CHADHAVA or EPUJA in folder mapping mode.' }, { status: 400 })
      }

      if (!isValidDriveLink(folderLink)) {
        return NextResponse.json({ error: 'folderLink must be a valid Google Drive folder link.' }, { status: 400 })
      }

      // Parse folder items — NEVER fabricate a mapping. If nothing can be parsed, that must
      // surface as a clear error to the admin, not a fake video link silently emailed to a
      // real customer. See parseDriveFolder() for how the folder is actually read (Drive API
      // v3 when GOOGLE_DRIVE_API_KEY is configured, best-effort HTML scan otherwise).
      const parsed = await parseDriveFolder(folderLink)

      if (parsed.length === 0) {
        return NextResponse.json(
          {
            error:
              'No video files could be matched to an Order ID in that folder. Make sure the folder is shared as "Anyone with the link", each video file is named exactly as the Order ID (e.g. cmrqgaffz0000i0xo9cogfuq9.mp4), and GOOGLE_DRIVE_API_KEY is configured on the server for reliable folder scanning. You can also use Manual Row Entry below.'
          },
          { status: 400 }
        )
      }

      items = parsed.map(p => ({
        orderType: orderType as 'CHADHAVA' | 'EPUJA',
        orderId: p.orderId,
        driveLink: p.fileUrl
      }))
    } else {
      // Manual mode
      items = Array.isArray(body?.items) ? body.items : []
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No orders or videos to process.' }, { status: 400 })
    }

    const results: { orderType: string; orderId: string; driveLink: string; status: 'SUCCESS' | 'FAILED'; errorReason?: string }[] = []

    for (const raw of items) {
      const orderType = raw?.orderType
      const orderId = (raw?.orderId || '').trim()
      const driveLink = (raw?.driveLink || '').trim()

      if (orderType !== 'CHADHAVA' && orderType !== 'EPUJA') {
        results.push({ orderType: String(orderType), orderId, driveLink, status: 'FAILED', errorReason: 'orderType must be CHADHAVA or EPUJA.' })
        continue
      }

      if (!orderId) {
        results.push({ orderType, orderId, driveLink, status: 'FAILED', errorReason: 'orderId is required.' })
        continue
      }

      if (!isValidDriveLink(driveLink)) {
        results.push({ orderType, orderId, driveLink, status: 'FAILED', errorReason: 'driveLink must be a valid https://drive.google.com (or docs.google.com) link.' })
        continue
      }

      try {
        const model = orderType === 'CHADHAVA' ? prisma.chadhavaOrder : prisma.pujaOrder

        const order = await (model as any).findUnique({
          where: { id: orderId },
          include: { user: { select: { name: true, email: true } }, ...(orderType === 'CHADHAVA' ? { chadhavaListing: true } : { pujaListing: true, pujaPackage: true }) }
        })

        if (!order) {
          results.push({ orderType, orderId, driveLink, status: 'FAILED', errorReason: 'Order not found.' })
          continue
        }

        // Idempotency: don't overwrite a video that's already uploaded and not yet expired.
        if (order.videoUrl && !order.videoExpired) {
          results.push({ orderType, orderId, driveLink, status: 'FAILED', errorReason: 'Video already uploaded for this order.' })
          continue
        }

        const uploadedAt = new Date()

        await (model as any).update({
          where: { id: orderId },
          data: { videoUrl: driveLink, videoUploadedAt: uploadedAt, videoExpired: false }
        })

        await logOrderTrail({
          orderType,
          orderId,
          status: order.status,
          note: 'Video uploaded (Google Drive link attached) — visible to customer for 48 hours',
          actorId: admin.id,
          actorRole: 'ADMIN',
          req
        })

        const itemLabel = orderType === 'CHADHAVA' ? order.chadhavaListing?.title : order.pujaListing?.title

        if (order.user?.email) {
          const { subject, html } = videoReadyEmail({
            customerName: order.user.name || 'Devotee',
            itemLabel: itemLabel || 'offering',
            orderId,
            videoUrl: driveLink
          })

          await sendEmail({ to: order.user.email, subject, html })
        }

        results.push({ orderType, orderId, driveLink, status: 'SUCCESS' })
      } catch (err) {
        results.push({ orderType, orderId, driveLink, status: 'FAILED', errorReason: err instanceof Error ? err.message : 'Unexpected error.' })
      }
    }

    const successCount = results.filter(r => r.status === 'SUCCESS').length
    const failedCount = results.length - successCount

    const batch = await prisma.videoUploadBatch.create({
      data: {
        createdById: admin.id,
        totalCount: results.length,
        successCount,
        failedCount,
        items: { create: results }
      },
      include: { items: true }
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
