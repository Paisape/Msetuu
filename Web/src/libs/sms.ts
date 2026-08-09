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

    if (!res.ok) {
      await prisma.smsLog.create({
        data: {
          mobile: formattedMobile,
          message,
          templateId: finalTemplateId,
          status: 'FAILED',
          requestUrl: redactedUrl,
          response: typeof data === 'object' ? JSON.stringify(data) : String(data),
          error: `Textzi API error HTTP ${res.status}`
        }
      }).catch(err => console.error('[SMS] Logging failed:', err))

      return {
        success: false,
        httpCode: res.status,
        message: `Textzi API error HTTP ${res.status}`,
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
  const message = renderOtpSms(otp)
  const activeTemplateId = templateId || DEFAULT_OTP_TEMPLATE_ID

  return sendTextziSms(mobile, message, activeTemplateId)
}

// Snake-case aliases matching core/sms.php specs
export const send_textzi_sms = sendTextziSms
export const send_otp_sms = sendOtpSms
