import { sendViaSmtp } from '@/libs/mailer'

// Every customer-facing email in the app goes through this one function, so callers never need
// to know which provider is behind it. Sending is a best-effort side effect — a failure here
// must never break the order/booking/video-upload flow that triggered it, so this never throws.
export type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export type SendEmailResult = { sent: true; id?: string } | { sent: false; reason: string }

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  if (!to || typeof to !== 'string') {
    return { sent: false, reason: 'No recipient email address provided.' }
  }

  const result = await sendViaSmtp(to, subject, html)

  if (!result.sent) {
    console.warn(`[email] Failed to send "${subject}" to ${to}: ${result.reason}`)
  }

  return result
}
