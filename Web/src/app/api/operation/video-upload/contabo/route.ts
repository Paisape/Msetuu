import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { logOrderTrail } from '@/libs/orderTrail'
import { videoReadyEmail } from '@/libs/emailTemplates'
import { sendEmail } from '@/libs/email'
import { sendVideoUploadedSms } from '@/libs/sms'
import { notifyUser } from '@/libs/notificationSystem'
import { orderIdFromFilename, ensureOfferLinkOrderVideoColumns } from '@/libs/videoUpload'
import { uploadToContabo, getContaboConfig } from '@/libs/contaboStorage'

export const maxDuration = 300 // allow up to 5 min for large video uploads

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const config = await getContaboConfig()

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contabo S3 storage credentials are not configured. Please set CONTABO_S3_ACCESS_KEY and CONTABO_S3_SECRET_KEY in settings or .env.'
        },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const orderType = (formData.get('orderType') as string) || 'CAMPAIGN'
    const orderIdOverride = (formData.get('orderId') as string)?.trim() || ''

    if (!file) {
      return NextResponse.json({ success: false, error: 'No video file provided.' }, { status: 400 })
    }

    // Determine target Order ID (from override or from filename like 70BA0027.mp4)
    let parsedId = orderIdOverride
    if (!parsedId) {
      parsedId = orderIdFromFilename(file.name) || ''
    }

    if (!parsedId) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not determine Order ID from filename "${file.name}". Please ensure the file is named with the Order ID (e.g. 70BA0027.mp4).`
        },
        { status: 400 }
      )
    }

    const cleanId = parsedId.replace(/^[#\s]*(MS[-_]?|ORD[-_]?)/i, '').trim()

    // 1. Resolve target order from DB
    let order: any = null
    let customerName = 'Devotee'
    let customerEmail: string | null = null
    let customerPhone: string | null = null
    let userId: string | null = null
    let itemLabel = 'Offering'
    let orderStatus = 'CONFIRMED'

    if (orderType === 'CAMPAIGN') {
      await ensureOfferLinkOrderVideoColumns()

      const campaignInclude = {
        offerLink: true,
        devotees: { orderBy: { isPrimary: 'desc' as const } }
      }

      order = await prisma.offerLinkOrder.findFirst({
        where: {
          OR: [
            { id: parsedId },
            { id: cleanId },
            { id: { equals: cleanId, mode: 'insensitive' } },
            { id: { equals: cleanId.toLowerCase() } }
          ]
        },
        include: campaignInclude
      }).catch(err => {
        console.error('[Contabo Upload Campaign lookup error]:', err)
        return null
      })

      if (!order && cleanId.length >= 6) {
        order = await prisma.offerLinkOrder.findFirst({
          where: {
            OR: [
              { id: { startsWith: cleanId, mode: 'insensitive' } },
              { id: { startsWith: cleanId.toLowerCase() } }
            ]
          },
          include: campaignInclude
        }).catch(err => {
          console.error('[Contabo Upload Campaign prefix match error]:', err)
          return null
        })
      }

      if (order) {
        const primaryDevotee = order.devotees?.find((d: any) => d.isPrimary) || order.devotees?.[0]
        customerName = primaryDevotee?.name || 'Devotee'
        customerEmail = primaryDevotee?.email || null
        customerPhone = primaryDevotee?.phone || order.devotees?.[0]?.phone || null
        itemLabel = order.offerLink?.title || 'Campaign Offering'
        orderStatus = order.paymentStatus === 'SUCCESS' ? 'CONFIRMED' : order.paymentStatus
      }
    } else {
      const model = orderType === 'CHADHAVA' ? prisma.chadhavaOrder : prisma.pujaOrder

      order = await (model as any).findUnique({
        where: { id: parsedId },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          ...(orderType === 'CHADHAVA' ? { chadhavaListing: true } : { pujaListing: true, pujaPackage: true })
        }
      }).catch(() => null)

      if (!order && cleanId.length >= 6) {
        order = await (model as any).findFirst({
          where: { id: { startsWith: cleanId, mode: 'insensitive' } },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            ...(orderType === 'CHADHAVA' ? { chadhavaListing: true } : { pujaListing: true, pujaPackage: true })
          }
        }).catch(() => null)
      }

      if (order) {
        customerName = order.user?.name || 'Devotee'
        customerEmail = order.user?.email || null
        customerPhone = order.user?.phone || null
        userId = order.userId || null
        itemLabel = (orderType === 'CHADHAVA' ? order.chadhavaListing?.title : order.pujaListing?.title) || 'Offering'
        orderStatus = order.status || 'CONFIRMED'
      }
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: `Order not found for parsed ID "${parsedId}" (clean: "${cleanId}").`
        },
        { status: 404 }
      )
    }

    // 2. Upload file directly to Contabo Bucket
    const fileBytes = await file.arrayBuffer()
    const fileBuffer = Buffer.from(fileBytes)
    const fileExt = file.name.split('.').pop() || 'mp4'
    const shortHex = (cleanId.length > 8 ? cleanId.slice(0, 8) : cleanId).toUpperCase()
    const destinationPath = `videos/${new Date().getFullYear()}/${shortHex}.${fileExt}`

    const uploadRes = await uploadToContabo(fileBuffer, destinationPath, file.type || 'video/mp4')

    if (!uploadRes.success || !uploadRes.url) {
      return NextResponse.json(
        {
          success: false,
          error: uploadRes.error || 'Failed to upload video to Contabo S3 bucket.'
        },
        { status: 502 }
      )
    }

    const contaboVideoUrl = uploadRes.url
    const uploadedAt = new Date()

    // 3. Update Order in Database
    if (orderType === 'CAMPAIGN') {
      try {
        await prisma.offerLinkOrder.update({
          where: { id: order.id },
          data: { videoUrl: contaboVideoUrl, videoUploadedAt: uploadedAt, videoExpired: false }
        })
      } catch {
        await ensureOfferLinkOrderVideoColumns()
        await prisma.$executeRawUnsafe(
          `UPDATE "OfferLinkOrder" SET "videoUrl" = $1, "videoUploadedAt" = $2, "videoExpired" = false WHERE id = $3`,
          contaboVideoUrl,
          uploadedAt,
          order.id
        ).catch(() => {
          return prisma.$executeRawUnsafe(
            `UPDATE offerlinkorder SET "videoUrl" = $1, "videoUploadedAt" = $2, "videoExpired" = false WHERE id = $3`,
            contaboVideoUrl,
            uploadedAt,
            order.id
          )
        })
      }
    } else {
      const model = orderType === 'CHADHAVA' ? prisma.chadhavaOrder : prisma.pujaOrder
      await (model as any).update({
        where: { id: order.id },
        data: { videoUrl: contaboVideoUrl, videoUploadedAt: uploadedAt, videoExpired: false }
      })
    }

    // 4. Log order audit trail
    await logOrderTrail({
      orderType: orderType === 'CAMPAIGN' ? 'OFFER' : (orderType as any),
      orderId: order.id,
      status: orderStatus,
      note: 'Video uploaded to Contabo Object Storage — visible to customer for 48 hours / 10 days',
      actorId: admin.id,
      actorRole: 'ADMIN',
      req
    }).catch(() => null)

    // 5. Send Devotee Notifications
    // Email
    if (customerEmail) {
      const { subject, html } = videoReadyEmail({
        customerName,
        itemLabel,
        orderId: order.id,
        videoUrl: contaboVideoUrl
      })
      await sendEmail({ to: customerEmail, subject, html }).catch(() => null)
    }

    // DLT SMS
    let smsDispatched = false
    if (customerPhone) {
      const smsRes = await sendVideoUploadedSms({
        mobile: customerPhone,
        orderId: order.id
      }).catch(err => {
        console.error('[Contabo Upload] SMS failed:', err)
        return { success: false }
      })
      smsDispatched = !!smsRes?.success
    }

    // WhatsApp / Firebase
    if (userId) {
      notifyUser(
        userId,
        `Your ${itemLabel || 'Puja'} Video Is Ready`,
        `The video of your ${itemLabel || 'offering'} (#${order.id.slice(-8)}) has been uploaded and is ready to view.`,
        ['firebase', 'whatsapp']
      ).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      shortId: shortHex,
      customerName,
      customerPhone,
      videoUrl: contaboVideoUrl,
      smsDispatched,
      message: `Video uploaded to Contabo and mapped to order ${order.id} successfully!`
    })
  } catch (err) {
    return handleApiError(err)
  }
}
