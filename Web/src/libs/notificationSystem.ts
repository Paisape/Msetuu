import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'
import { getResolvedSettings } from '@/libs/secureConfigSettings'

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'firebase'

export type SendNotificationOptions = {
  title: string
  message: string
  actionUrl?: string
  targetAudience: 'ALL' | 'SPECIFIC' | 'CUSTOMERS'
  targetEmail?: string
  channels: NotificationChannel[]
  sentById?: string
}

// 1. Email Channel Dispatcher
export async function sendEmailNotification(toEmail: string, title: string, message: string, actionUrl?: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
      <div style="background-color: #1e293b; padding: 20px 24px; text-align: center; border-bottom: 2px solid #f59e0b;">
        <h2 style="color: #fbbf24; margin: 0; font-size: 20px;">Mandirsetuu Notification</h2>
      </div>
      <div style="padding: 24px; line-height: 1.6;">
        <h3 style="color: #ffffff; font-size: 18px; margin-top: 0;">${title}</h3>
        <p style="color: #cbd5e1; font-size: 15px; white-space: pre-line;">${message}</p>
        ${
          actionUrl
            ? `<div style="margin-top: 24px; text-align: center;">
                 <a href="${actionUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                   View Details ↗
                 </a>
               </div>`
            : ''
        }
      </div>
      <div style="background-color: #020617; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} Mandirsetuu. All Rights Reserved.
      </div>
    </div>
  `
  return sendEmail({ to: toEmail, subject: title, html })
}

// 2. SMS Channel Dispatcher (MSG91 / Twilio / Custom HTTP)
export async function sendSmsNotification(phone: string, title: string, message: string) {
  try {
    const smsSettings = await getResolvedSettings('SMS')
    const apiKey = smsSettings.SMS_API_KEY || process.env.SMS_API_KEY
    const senderId = smsSettings.SMS_SENDER_ID || process.env.SMS_SENDER_ID || 'MNDRST'

    if (!apiKey || !phone) return false

    // MSG91 / Standard HTTP SMS Payload
    const textMessage = `${title}: ${message}`
    const response = await fetch(`https://api.msg91.com/api/v2/sendsms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: apiKey
      },
      body: JSON.stringify({
        sender: senderId,
        route: '4',
        country: '91',
        sms: [{ message: textMessage, to: [phone.replace(/\D/g, '')] }]
      })
    }).catch(() => null)

    return response ? response.ok : true
  } catch (err) {
    console.error('[NotificationSystem SMS] Error:', err)
    return false
  }
}

// 3. WhatsApp Channel Dispatcher (WhatsApp Business API / Interakt / Meta)
export async function sendWhatsAppNotification(phone: string, title: string, message: string, actionUrl?: string) {
  try {
    const waSettings = await getResolvedSettings('WHATSAPP')
    const apiKey = waSettings.WHATSAPP_API_KEY || process.env.WHATSAPP_API_KEY
    const phoneId = waSettings.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!apiKey || !phone) return false

    // Meta WhatsApp Cloud API endpoint call
    const cleanPhone = phone.replace(/\D/g, '')
    const url = phoneId
      ? `https://graph.facebook.com/v18.0/${phoneId}/messages`
      : 'https://api.interakt.ai/v1/public/track/users/'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: `*${title}*\n\n${message}${actionUrl ? `\n\nLink: ${actionUrl}` : ''}` }
      })
    }).catch(() => null)

    return response ? response.ok : true
  } catch (err) {
    console.error('[NotificationSystem WhatsApp] Error:', err)
    return false
  }
}

// 4. Firebase Push Notification Channel Dispatcher (FCM HTTP v1 / Server Key)
export async function sendFirebasePushNotification(fcmToken: string, title: string, message: string, actionUrl?: string) {
  try {
    const fbSettings = await getResolvedSettings('FIREBASE')
    const serverKey = fbSettings.FIREBASE_SERVER_KEY || process.env.FIREBASE_SERVER_KEY || process.env.FCM_SERVER_KEY

    if (!serverKey || !fcmToken) return false

    // FCM Legacy / Direct HTTP API
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serverKey}`
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title,
          body: message,
          click_action: actionUrl || '/'
        },
        data: {
          title,
          message,
          actionUrl: actionUrl || '/'
        }
      })
    }).catch(() => null)

    return response ? response.ok : true
  } catch (err) {
    console.error('[NotificationSystem Firebase] Error:', err)
    return false
  }
}

// 5. Combined Multi-Channel Dispatcher
export async function dispatchNotificationBroadcast(options: SendNotificationOptions) {
  const { title, message, actionUrl, targetAudience, targetEmail, channels, sentById } = options

  let targetUsers: { id: string; email: string | null; phone: string | null; fcmToken: string | null }[] = []

  if (targetAudience === 'SPECIFIC' && targetEmail) {
    const singleUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: targetEmail.trim().toLowerCase() }, { phone: targetEmail.trim() }]
      },
      select: { id: true, email: true, phone: true, fcmToken: true }
    })
    if (singleUser) targetUsers = [singleUser]
    else targetUsers = [{ id: 'manual', email: targetEmail, phone: targetEmail, fcmToken: null }]
  } else if (targetAudience === 'CUSTOMERS') {
    targetUsers = await prisma.user.findMany({
      where: {
        OR: [
          { chadhavaOrders: { some: {} } },
          { pujaOrders: { some: {} } },
          { productOrders: { some: {} } }
        ]
      },
      select: { id: true, email: true, phone: true, fcmToken: true }
    })
  } else {
    // ALL Users
    targetUsers = await prisma.user.findMany({
      select: { id: true, email: true, phone: true, fcmToken: true }
    })
  }

  let emailSentCount = 0
  let smsSentCount = 0
  let whatsappSentCount = 0
  let firebaseSentCount = 0

  const hasEmail = channels.includes('email')
  const hasSms = channels.includes('sms')
  const hasWhatsapp = channels.includes('whatsapp')
  const hasFirebase = channels.includes('firebase')

  // Process batch dispatch
  await Promise.all(
    targetUsers.map(async u => {
      if (hasEmail && u.email) {
        const ok = await sendEmailNotification(u.email, title, message, actionUrl).catch(() => false)
        if (ok) emailSentCount++
      }

      if (hasSms && u.phone) {
        const ok = await sendSmsNotification(u.phone, title, message).catch(() => false)
        if (ok) smsSentCount++
      }

      if (hasWhatsapp && u.phone) {
        const ok = await sendWhatsAppNotification(u.phone, title, message, actionUrl).catch(() => false)
        if (ok) whatsappSentCount++
      }

      if (hasFirebase && u.fcmToken) {
        const ok = await sendFirebasePushNotification(u.fcmToken, title, message, actionUrl).catch(() => false)
        if (ok) firebaseSentCount++
      }
    })
  )

  const stats = {
    emailSent: emailSentCount,
    smsSent: smsSentCount,
    whatsappSent: whatsappSentCount,
    firebaseSent: firebaseSentCount,
    totalRecipients: targetUsers.length
  }

  // Create NotificationLog record in database
  const log = await prisma.notificationLog.create({
    data: {
      title,
      message,
      actionUrl: actionUrl || null,
      targetAudience,
      targetEmail: targetEmail || null,
      channels: JSON.stringify(channels),
      status: 'SENT',
      stats: JSON.stringify(stats),
      sentById: sentById || null
    }
  })

  return {
    success: true,
    logId: log.id,
    stats
  }
}
