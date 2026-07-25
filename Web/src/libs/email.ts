import { sendViaSmtp } from '@/libs/mailer'
import type { SmtpCategory } from '@/libs/mailer'

// Every customer-facing email in the app goes through this one function, so callers never need
// to know which provider is behind it. Sending is a best-effort side effect — a failure here
// must never break the order/booking/video-upload flow that triggered it, so this never throws.
export type SendEmailInput = {
  to: string
  subject: string
  html: string

  // Defaults to the main transactional SMTP account. Pass 'NOTIFICATION_EMAIL' for anything sent
  // through the notification system (broadcasts, new-listing/welcome/order-accepted/video-uploaded
  // alerts) so it uses the separate notification SMTP account instead.
  category?: SmtpCategory
}

export type SendEmailResult = { sent: true; id?: string } | { sent: false; reason: string }

function stripHtml(html: string): string {
  let text = html.replace(/<br\s*[\/]?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<[^>]*>?/gm, '')
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&copy;/g, '©')
  return text.replace(/\n\s+\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

export async function sendEmail({ to, subject, html, category }: SendEmailInput): Promise<SendEmailResult> {
  if (!to || typeof to !== 'string') {
    return { sent: false, reason: 'No recipient email address provided.' }
  }

  const text = stripHtml(html)
  const result = await sendViaSmtp(to, subject, html, text, category)

  if (!result.sent) {
    console.warn(`[email] Failed to send "${subject}" to ${to}: ${result.reason}`)
  }

  return result
}
