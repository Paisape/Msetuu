/**
 * Textzi SMS Gateway Integration Library
 * Core module for dispatching SMS via Textzi API GET URL endpoint with DLT Template support.
 * Project: Paisape / MandirSetu
 */

import prisma from '@/libs/prisma'
import { getSettingOrEnv } from '@/libs/appSettings'
import { DEFAULT_OTP_TEMPLATE_ID, renderOtpSms } from '@/libs/smsTemplates'

export interface SendSmsResult {
  success: boolean
  message?: string
  response?: any
  httpCode?: number
}

/**
 * Format mobile number to standard 12-digit string starting with country code 91
 *
 * @param mobile 10-digit or 12-digit phone number
 */
export function formatTextziMobile(mobile: string): string {
  const clean = mobile.replace(/\D/g, '')
  if (clean.length === 10) {
    return `91${clean}`
  }
  return clean
}

/**
 * Core function to send SMS using Textzi GET API URL
 * Endpoint: GET https://api.textzi.in/v1/sms/send-url
 *
 * @param mobile Mobile number (10-digit or 12-digit with 91)
 * @param message SMS text message content (URL encoded during fetch)
 * @param templateId Optional DLT Template ID override
 */
export async function sendTextziSms(
  mobile: string,
  message: string,
  templateId?: string | null
): Promise<SendSmsResult> {
  const provider = (await getSettingOrEnv('SMS', 'SMS_PROVIDER', 'SMS_PROVIDER')) || 'TEXTZI'
  const activeTemplateId = templateId || DEFAULT_OTP_TEMPLATE_ID

  if (provider.toUpperCase() === 'DISABLED') {
    console.warn('[SMS] SMS Provider is set to DISABLED in settings. Skipping dispatch.')
    await prisma.smsLog.create({
      data: {
        mobile,
        message,
        templateId: activeTemplateId,
        status: 'DISABLED',
        requestUrl: 'N/A',
        error: 'SMS Provider is disabled in settings.'
      }
    }).catch(err => console.error('[SMS] Logging failed:', err))

    return { success: false, message: 'SMS Provider is disabled in settings.' }
  }

  const apiKey = await getSettingOrEnv('SMS', 'TEXTZI_API_KEY', 'TEXTZI_API_KEY')
  const userId = await getSettingOrEnv('SMS', 'TEXTZI_USER_ID', 'TEXTZI_USER_ID')
  const defaultTemplateId =
    (await getSettingOrEnv('SMS', 'TEXTZI_TEMPLATE_ID', 'TEXTZI_TEMPLATE_ID')) || DEFAULT_OTP_TEMPLATE_ID

  const finalTemplateId = templateId || defaultTemplateId
  const formattedMobile = formatTextziMobile(mobile)

  const redactedParams = new URLSearchParams({
    api_key: '••••',
    user_id: userId || '',
    mobile: formattedMobile,
    template_id: finalTemplateId,
    message: message
  })
  const redactedUrl = `https://api.textzi.in/v1/sms/send-url?${redactedParams.toString()}`

  if (!apiKey || !userId) {
    const errorMsg = 'Textzi SMS credentials (TEXTZI_API_KEY / TEXTZI_USER_ID) not configured.'
    console.error(`[SMS] ${errorMsg}`)
    
    await prisma.smsLog.create({
      data: {
        mobile: formattedMobile,
        message,
        templateId: finalTemplateId,
        status: 'FAILED',
        requestUrl: redactedUrl,
        error: errorMsg
      }
    }).catch(err => console.error('[SMS] Logging failed:', err))

    return {
      success: false,
      message: errorMsg
    }
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    user_id: userId,
    mobile: formattedMobile,
    template_id: finalTemplateId,
    message: message
  })

  const apiUrl = `https://api.textzi.in/v1/sms/send-url?${params.toString()}`

  try {
    const res = await fetch(apiUrl, { method: 'GET', cache: 'no-store' })
    const text = await res.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    const isPayloadError =
      typeof data === 'object' &&
      data !== null &&
      (data.status === 'error' ||
        data.status === 'failed' ||
        data.type === 'error' ||
        data.responseCode === 'error' ||
        data.error)

    if (!res.ok || isPayloadError) {
      const errorDetail =
        (typeof data === 'object' && (data.message || data.error || data.msg)) ||
        `Textzi API error HTTP ${res.status}`

      await prisma.smsLog.create({
        data: {
          mobile: formattedMobile,
          message,
          templateId: finalTemplateId,
          status: 'FAILED',
          requestUrl: redactedUrl,
          response: typeof data === 'object' ? JSON.stringify(data) : String(data),
          error: errorDetail
        }
      }).catch(err => console.error('[SMS] Logging failed:', err))

      return {
        success: false,
        httpCode: res.status,
        message: errorDetail,
        response: data
      }
    }

    // Save success log
    await prisma.smsLog.create({
      data: {
        mobile: formattedMobile,
        message,
        templateId: finalTemplateId,
        status: 'SUCCESS',
        requestUrl: redactedUrl,
        response: typeof data === 'object' ? JSON.stringify(data) : String(data)
      }
    }).catch(err => console.error('[SMS] Logging failed:', err))

    return {
      success: true,
      httpCode: res.status,
      response: data
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to reach Textzi SMS endpoint'
    console.error('[SMS] Textzi API call failed:', err)

    await prisma.smsLog.create({
      data: {
        mobile: formattedMobile,
        message,
        templateId: finalTemplateId,
        status: 'FAILED',
        requestUrl: redactedUrl,
        error: errorMsg
      }
    }).catch(loggingErr => console.error('[SMS] Logging failed:', loggingErr))

    return {
      success: false,
      message: errorMsg
    }
  }
}

/**
 * Reusable helper: Send Paisape OTP SMS using registered DLT Template
 *
 * @param mobile Mobile number
 * @param otp Numeric or string OTP code
 * @param templateId Optional DLT Template ID override
 */
export async function sendOtpSms(
  mobile: string,
  otp: string | number,
  templateId?: string | null
): Promise<SendSmsResult> {
  let activeTemplateId = templateId || null

  if (!activeTemplateId) {
    // 1. Check if configured in Admin Config SMS settings (TEXTZI_TEMPLATE_ID)
    const configuredTemplateId = await getSettingOrEnv('SMS', 'TEXTZI_TEMPLATE_ID', 'TEXTZI_TEMPLATE_ID')
    if (configuredTemplateId) {
      activeTemplateId = configuredTemplateId
    } else {
      // 2. Check if a default template is marked in database smsTemplate table
      const defaultDbTpl = await prisma.smsTemplate.findFirst({ where: { isDefault: true, active: true } })
      activeTemplateId = defaultDbTpl?.templateId || DEFAULT_OTP_TEMPLATE_ID
    }
  }

  // Look up custom template content text from DB if available
  let customContent: string | undefined
  const dbTpl = await prisma.smsTemplate.findFirst({ where: { templateId: activeTemplateId, active: true } })
  if (dbTpl) {
    customContent = dbTpl.content
  }

  const message = renderOtpSms(otp, customContent)

  return sendTextziSms(mobile, message, activeTemplateId)
}

/**
 * Dispatch Order Confirmation SMS using DLT Template (Textzi Gateway)
 *
 * Registered DLT Template ID: 1177178781863763226
 * Content: "Dear Devotee, Your offering has been successfully booked. Your Order ID is {#alp#}. You can track your booking details here: {#urg#}.Team Mandirsetuu"
 */
export async function sendOrderConfirmationSms({
  mobile,
  orderId,
  trackLink
}: {
  mobile: string
  orderId: string
  trackLink?: string
}): Promise<SendSmsResult> {
  if (!mobile || !mobile.trim()) {
    return { success: false, message: 'Missing mobile number.' }
  }

  try {
    let template = await prisma.smsTemplate.findFirst({
      where: {
        active: true,
        OR: [
          { category: 'ORDER_CONFIRMATION' },
          { templateId: '1177178781863763226' },
          { name: { contains: 'Order Confirmation', mode: 'insensitive' } },
          { name: { contains: 'oRDE', mode: 'insensitive' } }
        ]
      }
    })

    const templateId = template?.templateId || '1177178781863763226'
    const defaultContent =
      'Dear Devotee, Your offering has been successfully booked. Your Order ID is {#alp#}. You can track your booking details here: {#urg#}.Team Mandirsetuu'
    const rawContent = template?.content || defaultContent

    // Ensure tracking link strictly uses https://www.mandirsetuu.com as required by DLT whitelisting
    let appUrl = 'https://www.mandirsetuu.com'
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
      let configured = process.env.NEXT_PUBLIC_APP_URL.trim()
      if (configured.startsWith('http://')) configured = configured.replace('http://', 'https://')
      if (configured.includes('mandirsetuu.com') && !configured.includes('www.mandirsetuu.com')) {
        configured = configured.replace('mandirsetuu.com', 'www.mandirsetuu.com')
      }
      appUrl = configured
    }

    const cleanAlphanumeric = orderId.replace(/[^a-zA-Z0-9]/g, '')
    const shortOrderId = (cleanAlphanumeric.length > 8 ? cleanAlphanumeric.slice(0, 8) : cleanAlphanumeric || 'ORDER').toUpperCase()
    
    let finalTrackLink = trackLink || `${appUrl}/t/?id=${shortOrderId}`
    if (finalTrackLink.includes('mandirsetuu.com') && !finalTrackLink.includes('www.mandirsetuu.com')) {
      finalTrackLink = finalTrackLink.replace('mandirsetuu.com', 'www.mandirsetuu.com')
    }
    if (finalTrackLink.startsWith('http://www.mandirsetuu.com')) {
      finalTrackLink = finalTrackLink.replace('http://', 'https://')
    }

    let message = rawContent
      .replace(/\{#alp#\}/g, shortOrderId)
      .replace(/\{#urg#\}/g, finalTrackLink)
      .replace(/\{#orderId#\}/g, shortOrderId)
      .replace(/\{#trackLink#\}/g, finalTrackLink)
      .replace(/\{#order_id#\}/g, shortOrderId)
      .replace(/\{#link#\}/g, finalTrackLink)
      .replace(/\{#url#\}/g, finalTrackLink)
      .replace(/\{#num#\}/g, shortOrderId)
      .replace(/\{#var#\}/g, shortOrderId)
      .replace(/\{orderId\}/g, shortOrderId)
      .replace(/\{trackLink\}/g, finalTrackLink)

    return await sendTextziSms(mobile, message, templateId)
  } catch (err: any) {
    console.error('[SMS] Failed to send order confirmation SMS:', err)
    return { success: false, message: err.message || 'Failed to send SMS.' }
  }
}

// Snake-case aliases matching core/sms.php specs
export const send_textzi_sms = sendTextziSms
export const send_otp_sms = sendOtpSms
export const send_order_confirmation_sms = sendOrderConfirmationSms
