import nodemailer from 'nodemailer'

import { getSettingsForCategory } from '@/libs/appSettings'

// SMTP transport used for every outgoing email (order confirmations, payment receipts, video
// notifications, OTPs, etc.). Config is resolved DB-first (Config > Email, admin-editable),
// falling back to .env — this is the pattern every secret-consuming lib in this app follows so
// the admin panel can override without a server restart.
type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
  const dbSettings = await getSettingsForCategory('EMAIL').catch(() => ({}) as Record<string, string>)

  const host = dbSettings.SMTP_HOST || process.env.SMTP_HOST
  const port = Number(dbSettings.SMTP_PORT || process.env.SMTP_PORT || 465)
  const secureRaw = dbSettings.SMTP_SECURE ?? process.env.SMTP_SECURE
  const secure = secureRaw !== 'false'
  const user = dbSettings.SMTP_USER || process.env.SMTP_USER
  const pass = dbSettings.SMTP_PASSWORD || process.env.SMTP_PASSWORD
  const fromName = dbSettings.SMTP_FROM_NAME || process.env.SMTP_FROM_NAME || 'Mandirsetuu'
  const fromEmail = dbSettings.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || user

  if (!host || !user || !pass || !fromEmail) return null

  return { host, port, secure, user, pass, fromName, fromEmail }
}

let cached: { key: string; transporter: nodemailer.Transporter } | null = null

async function getTransporter(): Promise<{ transporter: nodemailer.Transporter; from: string } | null> {
  const config = await resolveSmtpConfig()

  if (!config) return null

  const cacheKey = `${config.host}:${config.port}:${config.user}`

  if (cached?.key !== cacheKey) {
    cached = {
      key: cacheKey,
      transporter: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass }
      })
    }
  }

  return { transporter: cached.transporter, from: `"${config.fromName}" <${config.fromEmail}>` }
}

export async function sendViaSmtp(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: true; id?: string } | { sent: false; reason: string }> {
  const resolved = await getTransporter()

  if (!resolved) {
    return { sent: false, reason: 'SMTP is not configured — set it up under Config > Email, or SMTP_* env vars.' }
  }

  try {
    const info = await resolved.transporter.sendMail({ from: resolved.from, to, subject, html })

    return { sent: true, id: info.messageId }
  } catch (err) {
    console.error('[mailer] Failed to send email via SMTP:', err)

    return { sent: false, reason: err instanceof Error ? err.message : 'Unknown SMTP send error.' }
  }
}

// Lets the Config > Email admin form "Send test email" button verify credentials work without
// digging through the whole app for a real trigger.
export async function sendTestEmail(to: string): Promise<{ sent: true; id?: string } | { sent: false; reason: string }> {
  return sendViaSmtp(to, 'Mandirsetuu — SMTP test email', '<p>This is a test email confirming your SMTP settings are working correctly.</p>')
}
