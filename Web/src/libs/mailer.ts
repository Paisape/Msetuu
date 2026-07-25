import nodemailer from 'nodemailer'

import { getSettingsForCategory } from '@/libs/appSettings'

// SMTP transport used for outgoing email. Two independent configs are supported:
//   'EMAIL'              — order confirmations, payment receipts, OTPs, password reset, etc.
//   'NOTIFICATION_EMAIL'  — the notification system (admin broadcasts + automatic new-listing/
//                            welcome/order-accepted/video-uploaded triggers), kept on its own
//                            SMTP account so notification volume never risks the deliverability
//                            of transactional email. If NOTIFICATION_EMAIL hasn't been configured
//                            yet, it falls back to the main EMAIL config so notifications keep
//                            working before an admin sets up a dedicated account.
// Config is resolved DB-first (Config admin panel), falling back to .env — the pattern every
// secret-consuming lib in this app follows so the admin panel can override without a restart.
export type SmtpCategory = 'EMAIL' | 'NOTIFICATION_EMAIL'

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

async function resolveSmtpConfig(category: SmtpCategory = 'EMAIL'): Promise<SmtpConfig | null> {
  const dbSettings = await getSettingsForCategory(category).catch(() => ({}) as Record<string, string>)

  const host = dbSettings.SMTP_HOST || (category === 'EMAIL' ? process.env.SMTP_HOST : undefined)
  const port = Number(dbSettings.SMTP_PORT || (category === 'EMAIL' ? process.env.SMTP_PORT : undefined) || 465)
  const secureRaw = dbSettings.SMTP_SECURE ?? (category === 'EMAIL' ? process.env.SMTP_SECURE : undefined)
  const secure = secureRaw !== 'false'
  const user = dbSettings.SMTP_USER || (category === 'EMAIL' ? process.env.SMTP_USER : undefined)
  const pass = dbSettings.SMTP_PASSWORD || (category === 'EMAIL' ? process.env.SMTP_PASSWORD : undefined)
  const fromName = dbSettings.SMTP_FROM_NAME || (category === 'EMAIL' ? process.env.SMTP_FROM_NAME : undefined) || 'Mandirsetuu'
  const fromEmail = dbSettings.SMTP_FROM_EMAIL || (category === 'EMAIL' ? process.env.SMTP_FROM_EMAIL : undefined) || user

  if (!host || !user || !pass || !fromEmail) {
    // NOTIFICATION_EMAIL isn't configured yet — fall back to the main EMAIL account rather than
    // silently dropping notifications.
    if (category === 'NOTIFICATION_EMAIL') return resolveSmtpConfig('EMAIL')

    return null
  }

  return { host, port, secure, user, pass, fromName, fromEmail }
}

const transporterCache = new Map<string, nodemailer.Transporter>()

async function getTransporter(category: SmtpCategory): Promise<{ transporter: nodemailer.Transporter; from: string } | null> {
  const config = await resolveSmtpConfig(category)

  if (!config) return null

  const cacheKey = `${config.host}:${config.port}:${config.user}`

  let transporter = transporterCache.get(cacheKey)

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass }
    })
    transporterCache.set(cacheKey, transporter)
  }

  return { transporter, from: `"${config.fromName}" <${config.fromEmail}>` }
}

export async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
  text?: string,
  category: SmtpCategory = 'EMAIL'
): Promise<{ sent: true; id?: string } | { sent: false; reason: string }> {
  const resolved = await getTransporter(category)

  if (!resolved) {
    const configLabel = category === 'NOTIFICATION_EMAIL' ? 'Config > Notification Email (or Config > Email)' : 'Config > Email'

    return { sent: false, reason: `SMTP is not configured — set it up under ${configLabel}, or SMTP_* env vars.` }
  }

  try {
    const info = await resolved.transporter.sendMail({ from: resolved.from, to, subject, html, text })

    return { sent: true, id: info.messageId }
  } catch (err) {
    console.error('[mailer] Failed to send email via SMTP:', err)

    return { sent: false, reason: err instanceof Error ? err.message : 'Unknown SMTP send error.' }
  }
}

// Lets the Config > Email / Config > Notification Email admin forms' "Send test email" button
// verify credentials work without digging through the whole app for a real trigger.
export async function sendTestEmail(to: string, category: SmtpCategory = 'EMAIL'): Promise<{ sent: true; id?: string } | { sent: false; reason: string }> {
  const label = category === 'NOTIFICATION_EMAIL' ? 'notification' : 'SMTP'

  return sendViaSmtp(to, `Mandirsetuu — ${label} test email`, `<p>This is a test email confirming your ${label} settings are working correctly.</p>`, undefined, category)
}
