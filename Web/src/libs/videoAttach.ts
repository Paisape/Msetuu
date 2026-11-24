import prisma from '@/libs/prisma'
import { logOrderTrail } from '@/libs/orderTrail'
import { videoReadyEmail } from '@/libs/emailTemplates'
import { sendEmail } from '@/libs/email'
import { sendVideoUploadedSms } from '@/libs/sms'
import { notifyUser } from '@/libs/notificationSystem'
import { ensureOfferLinkOrderVideoColumns } from '@/libs/videoUpload'
import {
  ContaboConfig,
  objectUrl,
  headObjectSize,
  readObjectStart
} from '@/libs/contaboStorage'
import {
  ALLOWED_VIDEO_EXTS,
  MAX_VIDEO_BYTES,
  hasVideoSignature,
  ResolvedVideoOrder,
  VideoOrderType
} from '@/libs/videoOrders'

type AttachInput = {
  config: ContaboConfig
  admin: { id: string }
  req: Request
  orderType: VideoOrderType
  resolved: ResolvedVideoOrder
  key: string
}

export type AttachResult =
  | { ok: true; alreadyAttached?: boolean; isUpdate: boolean; smsDispatched: boolean; emailSent: boolean; videoUrl: string }
  | { ok: false; status: number; error: string }

const appBaseUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://www.mandirsetuu.com').trim().replace(/\/+$/, '')

export async function attachContaboVideo(input: AttachInput): Promise<AttachResult> {
  const { config, admin, req, orderType, resolved, key } = input
  const { order, customerName, customerEmail, customerPhone, userId, itemLabel, orderStatus } = resolved

  const fail = (status: number, error: string): AttachResult => ({ ok: false, status, error })
  const ext = (key.split('.').pop() || '').toLowerCase()
  if (!key.startsWith('videos/') || key.includes('..') || !ALLOWED_VIDEO_EXTS[ext]) {
    return fail(400, `"${key}" is not a valid video path.`)
  }

  const newUrl = objectUrl(config, key)

  if (order.videoUrl === newUrl && !order.videoExpired) {
    return { ok: true, alreadyAttached: true, isUpdate: false, smsDispatched: false, emailSent: false, videoUrl: newUrl }
  }

  const size = await headObjectSize(config, key)
  if (size === null) return { ok: false, status: 404, error: 'Uploaded file was not found in storage.' }
  if (size === 0) return fail(400, 'The uploaded file is empty.')
  if (size > MAX_VIDEO_BYTES) return fail(400, `Video exceeds the 500MB limit (${(size / 1048576).toFixed(1)}MB).`)

  const head = await readObjectStart(config, key, 16)
  if (!hasVideoSignature(ext, head)) return fail(400, `This file is not a valid .${ext} video.`)

  const isVideoUpdate = !!(order.videoUrl && !order.videoExpired)
  const uploadedAt = new Date()
  // Uploading the video is the last step of an order, so it is marked completed (campaign orders have no status column; the track page shows them as completed once a video exists).
  const data: Record<string, unknown> = { videoUrl: newUrl, videoUploadedAt: uploadedAt, videoExpired: false }
  const markCompleted = orderType !== 'CAMPAIGN' && order.status !== 'CANCELLED'
  if (markCompleted) data.status = 'COMPLETED'

  if (orderType === 'CAMPAIGN') {
    try {
      await (prisma.offerLinkOrder as any).update({ where: { id: order.id }, data })
    } catch {
      await ensureOfferLinkOrderVideoColumns()
      await prisma.$executeRawUnsafe(
        `UPDATE "OfferLinkOrder" SET "videoUrl" = $1, "videoUploadedAt" = $2, "videoExpired" = false WHERE id = $3`,
        newUrl,
        uploadedAt,
        order.id
      )
    }
  } else {
    const model = orderType === 'CHADHAVA' ? prisma.chadhavaOrder : prisma.pujaOrder
    await (model as any).update({ where: { id: order.id }, data })
  }

  await logOrderTrail({
    orderType: orderType === 'CAMPAIGN' ? 'OFFER' : (orderType as any),
    orderId: order.id,
    status: markCompleted ? 'COMPLETED' : orderStatus,
    note: isVideoUpdate
      ? 'Video replaced (Contabo S3) — SMS skipped to avoid a duplicate notification'
      : 'Video uploaded to Contabo Object Storage — visible to customer until deleted',
    actorId: admin.id,
    actorRole: 'ADMIN',
    req
  }).catch(err => console.error('[Video attach] audit trail failed:', err))

  let smsDispatched = false
  let emailSent = false

  if (!isVideoUpdate) {
    // Links go to the track page, which hands out a fresh signed link each time it is opened.
    const trackUrl = `${appBaseUrl()}/front-pages/track-order?id=${order.id}`

    if (customerEmail) {
      const { subject, html } = videoReadyEmail({ customerName, itemLabel, orderId: order.id, videoUrl: trackUrl })
      emailSent = await sendEmail({ to: customerEmail, subject, html })
        .then(r => r.sent)
        .catch(err => {
          console.error('[Video attach] email failed:', err)
          return false
        })
    }

    if (customerPhone) {
      const smsRes = await sendVideoUploadedSms({ mobile: customerPhone, orderId: order.id }).catch(err => {
        console.error('[Video attach] SMS failed:', err)
        return { success: false }
      })
      smsDispatched = !!smsRes?.success
    }

    if (userId) {
      notifyUser(
        userId,
        `Your ${itemLabel || 'Puja'} Video Is Ready`,
        `The video of your ${itemLabel || 'offering'} (#${order.id.slice(-8)}) has been uploaded and is ready to view.`,
        ['firebase', 'whatsapp']
      ).catch(err => console.error('[Video attach] notify failed:', err))
    }
  }

  return { ok: true, isUpdate: isVideoUpdate, smsDispatched, emailSent, videoUrl: newUrl }
}
