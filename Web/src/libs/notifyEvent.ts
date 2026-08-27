import { dispatchNotificationBroadcast, notifyUser } from '@/libs/notificationSystem'
import type { NotificationChannel } from '@/libs/notificationSystem'
import { getResolvedSettings } from '@/libs/secureConfigSettings'
import prisma from '@/libs/prisma'

function formatDltTemplate(template: string, values: string[], namedReplacements: Record<string, string>): string {
  let result = template
  for (const [key, val] of Object.entries(namedReplacements)) {
    result = result.replaceAll(`{${key}}`, val)
  }
  let index = 0
  result = result.replace(/\{#var#\}/g, () => {
    const replacement = values[index] !== undefined ? values[index] : '{#var#}'
    index++
    return replacement
  })
  return result
}

async function getDbSmsTemplate(categoryName: string, keywords: string[]): Promise<{ content: string; templateId: string } | null> {
  // 1. Try exact category match first
  const catTpl = await prisma.smsTemplate.findFirst({
    where: {
      category: categoryName,
      active: true
    }
  })
  if (catTpl) {
    return { content: catTpl.content, templateId: catTpl.templateId }
  }

  // 2. Fallback to keyword matching on name
  for (const keyword of keywords) {
    const tpl = await prisma.smsTemplate.findFirst({
      where: {
        name: { contains: keyword, mode: 'insensitive' },
        active: true
      }
    })
    if (tpl) {
      return { content: tpl.content, templateId: tpl.templateId }
    }
  }
  return null
}

// Business-event notification triggers — thin wrappers around notificationSystem.ts that decide
// *who* gets notified and with *what message* for a given app event. Every function here is
// best-effort and never throws, so a notification failure can never break the order/listing/
// registration flow that triggered it. Channels default to every configured channel (email +
// push + WhatsApp) — each per-channel sender in notificationSystem.ts already no-ops silently
// when that channel isn't configured or the recipient has no contact method for it.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const DEFAULT_CHANNELS: NotificationChannel[] = ['email', 'firebase', 'whatsapp']

// Fires whenever admin publishes a new Product/Chadhava/E-Puja/Kundli listing — announces it to
// every user across every configured channel.
export async function notifyNewListing(moduleLabel: string, title: string, listingUrl?: string) {
  try {
    await dispatchNotificationBroadcast({
      title: `New ${moduleLabel} Available`,
      message: `"${title}" has just been added — check it out now on Mandirsetuu!`,
      actionUrl: listingUrl ? `${APP_URL}${listingUrl}` : undefined,
      targetAudience: 'ALL',
      channels: DEFAULT_CHANNELS
    })
  } catch (err) {
    console.error('[notifyEvent] notifyNewListing failed:', err)
  }
}

// Fires once a new user's account is verified — a welcome message, distinct from the
// verification-OTP email itself (which is transactional and always sent regardless of this).
export async function notifyUserWelcome(userId: string, name?: string) {
  try {
    await notifyUser(
      userId,
      'Welcome to Mandirsetuu!',
      `${name ? `Hi ${name}, ` : ''}your account is verified and ready. Explore Chadhava, E-Puja, Kundli, Jyotish consultations and more.`,
      DEFAULT_CHANNELS,
      APP_URL
    )
  } catch (err) {
    console.error('[notifyEvent] notifyUserWelcome failed:', err)
  }
}

// Fires the first time an admin moves an order out of PENDING (into processing/confirmed/shared
// — whatever that module's next stage is called) — i.e. "we've received and accepted your
// request," regardless of the exact status label each module uses.
export async function notifyOrderAccepted(userId: string, moduleLabel: string, orderId: string) {
  try {
    const smsSettings = await getResolvedSettings('SMS')
    const waSettings = await getResolvedSettings('WHATSAPP')

    const trackLink = `${APP_URL}/t/${orderId}`

    // 1. Resolve SMS template
    let smsMessage = `Good news! Your ${moduleLabel} order (#${orderId.slice(-8)}) has been accepted and is now being processed.`
    let smsTemplateId = smsSettings.SMS_ORDER_ACCEPTED_TEMPLATE_ID || null

    // Look up in database DLT templates master first
    const dbSmsTemplate = await getDbSmsTemplate('ORDER_CONFIRMATION', ['order', 'confirm', 'accept'])
    if (dbSmsTemplate) {
      smsMessage = formatDltTemplate(dbSmsTemplate.content, [moduleLabel, orderId, trackLink], {
        campaign: moduleLabel,
        orderId,
        trackLink
      })
      smsTemplateId = dbSmsTemplate.templateId
    } else {
      // Fallback to secure settings override config
      const customSmsTemplate = smsSettings.SMS_ORDER_ACCEPTED_TEMPLATE
      if (customSmsTemplate) {
        smsMessage = formatDltTemplate(customSmsTemplate, [moduleLabel, orderId, trackLink], {
          campaign: moduleLabel,
          orderId,
          trackLink
        })
      }
    }

    // 2. Resolve WhatsApp template
    let waMessage = smsMessage
    const customWaTemplate = waSettings.WHATSAPP_ORDER_ACCEPTED_TEMPLATE
    if (customWaTemplate) {
      waMessage = formatDltTemplate(customWaTemplate, [moduleLabel, orderId, trackLink], {
        campaign: moduleLabel,
        orderId,
        trackLink
      })
    }

    // Email + Firebase Push Notification
    await notifyUser(
      userId,
      `Your ${moduleLabel} Order Has Been Accepted`,
      `Good news! Your ${moduleLabel} order (#${orderId.slice(-8)}) has been accepted and is now being processed.`,
      ['email', 'firebase'],
      `${APP_URL}/front-pages/my-orders`
    )

    // SMS (with short tracking link and DLT ID)
    await notifyUser(
      userId,
      `Order Accepted`,
      smsMessage,
      ['sms'],
      undefined,
      smsTemplateId
    )

    // WhatsApp (with short tracking link)
    await notifyUser(
      userId,
      `Your ${moduleLabel} Order Has Been Accepted`,
      waMessage,
      ['whatsapp'],
      trackLink
    )
  } catch (err) {
    console.error('[notifyEvent] notifyOrderAccepted failed:', err)
  }
}

// Fires when a completion-proof video becomes available on an order (either via the admin's
// batch Google Drive-link tool, or a video URL set directly on the order).
export async function notifyVideoUploaded(userId: string, moduleLabel: string, orderId: string) {
  try {
    const smsSettings = await getResolvedSettings('SMS')
    const waSettings = await getResolvedSettings('WHATSAPP')

    const videoLink = `${APP_URL}/v/${orderId}`

    // 1. Resolve SMS template
    let smsMessage = `The video of your ${moduleLabel} (#${orderId.slice(-8)}) has been uploaded and is ready to view.`
    let smsTemplateId = smsSettings.SMS_VIDEO_UPLOADED_TEMPLATE_ID || null

    // Look up in database DLT templates master first
    const dbSmsTemplate = await getDbSmsTemplate('VIDEO_UPLOADED', ['video', 'upload', 'proof'])
    if (dbSmsTemplate) {
      smsMessage = formatDltTemplate(dbSmsTemplate.content, [moduleLabel, orderId, videoLink], {
        campaign: moduleLabel,
        orderId,
        videoLink
      })
      smsTemplateId = dbSmsTemplate.templateId
    } else {
      // Fallback to secure settings override config
      const customSmsTemplate = smsSettings.SMS_VIDEO_UPLOADED_TEMPLATE
      if (customSmsTemplate) {
        smsMessage = formatDltTemplate(customSmsTemplate, [moduleLabel, orderId, videoLink], {
          campaign: moduleLabel,
          orderId,
          videoLink
        })
      }
    }

    // 2. Resolve WhatsApp template
    let waMessage = smsMessage
    const customWaTemplate = waSettings.WHATSAPP_VIDEO_UPLOADED_TEMPLATE
    if (customWaTemplate) {
      waMessage = formatDltTemplate(customWaTemplate, [moduleLabel, orderId, videoLink], {
        campaign: moduleLabel,
        orderId,
        videoLink
      })
    }

    // Email + Firebase Push Notification
    await notifyUser(
      userId,
      `Your ${moduleLabel} Video Is Ready`,
      `The video of your ${moduleLabel} (#${orderId.slice(-8)}) has been uploaded and is ready to view.`,
      ['email', 'firebase'],
      `${APP_URL}/front-pages/my-orders`
    )

    // SMS (with short video redirect link and DLT ID)
    await notifyUser(
      userId,
      `Video Ready`,
      smsMessage,
      ['sms'],
      undefined,
      smsTemplateId
    )

    // WhatsApp (with short video link)
    await notifyUser(
      userId,
      `Your ${moduleLabel} Video Is Ready`,
      waMessage,
      ['whatsapp'],
      videoLink
    )
  } catch (err) {
    console.error('[notifyEvent] notifyVideoUploaded failed:', err)
  }
}
