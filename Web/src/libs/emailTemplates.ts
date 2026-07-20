// Shared branded email layout + concrete templates for every customer-facing email the app
// sends. Keep the visual language (colors, logo, footer) here in one place — every new
// customer-interaction email should be added as its own small function below that calls
// `renderEmailLayout`, rather than building raw HTML inline at the call site.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const LOGO_URL = `${APP_URL}/images/logo-mandirsetuu.png`

const BRAND_GREEN = '#006241'
const BRAND_ORANGE = '#f97316'

// Wraps any block of body HTML in the branded header/footer shell. `bodyHtml` should be simple
// table/paragraph markup — email clients render a very small subset of CSS, so keep styling
// inline and layout table-based rather than relying on flexbox/grid.
export function renderEmailLayout(bodyHtml: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Mandirsetuu</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;font-size:1px;color:#f0fdf4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(16,185,129,0.15);">
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #ecfdf5 0%, #fff7ed 100%);padding:28px 24px;">
              <img src="${LOGO_URL}" alt="Mandirsetuu" width="72" style="display:block;margin:0 auto 8px;" />
              <div style="font-size:20px;font-weight:800;color:${BRAND_GREEN};letter-spacing:0.3px;">Mandirsetuu</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;color:#374151;font-size:14px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;">
              <hr style="border:none;border-top:1px solid rgba(16,185,129,0.15);margin:0 0 16px;" />
              <div style="font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                This is an automated message from Mandirsetuu.<br />
                Need help? Reply to this email or contact us at <a href="mailto:info@mandirsetuu.in" style="color:${BRAND_GREEN};">info@mandirsetuu.in</a>.<br />
                &copy; ${new Date().getFullYear()} Mandirsetuu. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg, ${BRAND_GREEN} 0%, #10b981 100%);color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:999px;">${text}</a>
  </div>`
}

// Any user-supplied free text (contact form message, names typed by a customer, etc.) must be
// escaped before being interpolated into these HTML templates — otherwise a message like
// "<img src=x onerror=alert(1)>" would execute in whatever mail client renders it.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;width:40%;">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:bold;text-align:right;">${value}</td>
  </tr>`
}

function infoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px;margin:20px 0;">
    ${rows}
  </table>`
}

// --- Concrete templates -----------------------------------------------------------------

export function orderPendingEmail(opts: { customerName: string; itemLabel: string; amount: number; orderId: string }): { subject: string; html: string } {
  const subject = `We've received your order — ${opts.itemLabel}`

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>Thank you for your order. We've received your request and it's awaiting payment confirmation.</p>
    ${infoTable(infoRow('Order', opts.itemLabel) + infoRow('Order ID', opts.orderId) + infoRow('Amount', `₹${opts.amount}`))}
    <p>You'll receive another email as soon as your payment is confirmed.</p>
  `

  return { subject, html: renderEmailLayout(body, `Your order ${opts.orderId} is awaiting payment.`) }
}

export function paymentSuccessEmail(opts: {
  customerName: string
  itemLabel: string
  amount: number
  orderId: string
  invoiceNumber?: string
}): { subject: string; html: string } {
  const subject = `Payment received — ${opts.itemLabel} (Order ${opts.orderId})`

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p><strong style="color:${BRAND_GREEN};">Your payment was successful!</strong> Here's a summary of your order:</p>
    ${infoTable(
      infoRow('Order', opts.itemLabel) +
        infoRow('Order ID', opts.orderId) +
        infoRow('Amount Paid', `₹${opts.amount}`) +
        (opts.invoiceNumber ? infoRow('Invoice No.', opts.invoiceNumber) : '')
    )}
    <p>We'll notify you again as your order progresses. You can track it anytime from your My Orders page.</p>
    ${ctaButton('View My Orders', `${APP_URL}/front-pages/my-orders`)}
  `

  return { subject, html: renderEmailLayout(body, `Payment confirmed for order ${opts.orderId}.`) }
}

export function videoReadyEmail(opts: { customerName: string; itemLabel: string; orderId: string; videoUrl: string }): { subject: string; html: string } {
  const subject = `Your ${opts.itemLabel} video is ready — Order ${opts.orderId}`

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>The video of your <strong>${opts.itemLabel}</strong> (Order ID: ${opts.orderId}) has been uploaded.</p>
    ${ctaButton('Watch / Download Video', opts.videoUrl)}
    <p style="color:#ef4444;font-size:13px;">This link will be available for 48 hours only — please save a copy now.</p>
  `

  return { subject, html: renderEmailLayout(body, `Your ${opts.itemLabel} video is ready.`) }
}

export function yatraBookingConfirmationEmail(opts: {
  customerName: string
  destination: string
  travelDate: string
  totalTravelers: number
  bookingId: string
}): { subject: string; html: string } {
  const subject = `Yatra booking request received — ${opts.destination}`

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>Thank you for registering your interest in a spiritual Yatra with us. Our travel coordinator will contact you within 24 hours with the full itinerary and package details.</p>
    ${infoTable(
      infoRow('Destination', opts.destination) +
        infoRow('Preferred Travel Date', opts.travelDate) +
        infoRow('Total Travelers', String(opts.totalTravelers)) +
        infoRow('Booking Reference', opts.bookingId)
    )}
  `

  return { subject, html: renderEmailLayout(body, `Your Yatra request for ${opts.destination} was received.`) }
}

export function reviewApprovedEmail(opts: { customerName: string; itemLabel: string; rating: number }): { subject: string; html: string } {
  const subject = `Your review is now live — ${opts.itemLabel}`
  const stars = '★'.repeat(opts.rating) + '☆'.repeat(5 - opts.rating)

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>Thank you for sharing your feedback! Your review for <strong>${opts.itemLabel}</strong> has been approved and is now visible to other devotees.</p>
    <p style="font-size:20px;color:#f59e0b;letter-spacing:2px;">${stars}</p>
  `

  return { subject, html: renderEmailLayout(body, `Your review for ${opts.itemLabel} is live.`) }
}

// Sent to the support inbox (not the customer) whenever someone submits the public Contact Us
// form — a new template since this is a distinct customer-interaction event from everything
// above (those are all customer-facing confirmations; this is an internal notification).
export function contactFormNotificationEmail(opts: { name: string; email: string; message: string }): { subject: string; html: string } {
  const name = escapeHtml(opts.name)
  const email = escapeHtml(opts.email)
  const message = escapeHtml(opts.message)

  const subject = `New Contact Us message from ${opts.name}`

  const body = `
    <p>A new message was submitted via the Contact Us form on the website.</p>
    ${infoTable(infoRow('Name', name) + infoRow('Email', email))}
    <p style="white-space:pre-wrap;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px;">${message}</p>
    <p style="color:#6b7280;font-size:12px;">Reply directly to this email to respond to ${name} at ${email}.</p>
  `

  return { subject, html: renderEmailLayout(body, `New Contact Us message from ${name}.`) }
}

export function secureConfigOtpEmail(opts: { otp: string }): { subject: string; html: string } {
  const subject = 'Mandirsetuu Config — password rotation OTP'

  const body = `
    <p>A password rotation was requested for the Mandirsetuu admin Config menu (Payment Gateway / Email / SMS settings).</p>
    <p>Enter this one-time code to confirm the new password:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px 32px;font-size:28px;font-weight:800;letter-spacing:8px;color:${BRAND_GREEN};">${opts.otp}</span>
    </div>
    <p style="color:#ef4444;font-size:13px;">This code expires in 10 minutes. If you did not request this, secure the admin account immediately.</p>
  `

  return { subject, html: renderEmailLayout(body, 'Your Config menu OTP code.') }
}

export function welcomeVerificationEmail(opts: { customerName: string; otp: string }): { subject: string; html: string } {
  const subject = 'Welcome to Mandirsetuu — Please verify your email'

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>Welcome to Mandirsetuu! Please verify your email address to complete your registration.</p>
    <p>Enter this one-time code on the verification page:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px 32px;font-size:28px;font-weight:800;letter-spacing:8px;color:#006241;">${opts.otp}</span>
    </div>
    <p style="color:#ef4444;font-size:13px;">This code expires in 15 minutes.</p>
  `

  return { subject, html: renderEmailLayout(body, 'Your registration verification code.') }
}

export function passwordResetOtpEmail(opts: { customerName: string; otp: string }): { subject: string; html: string } {
  const subject = 'Mandirsetuu — Password Reset Verification Code'

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>We received a request to reset your Mandirsetuu account password.</p>
    <p>Enter this one-time code to set a new password:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px 32px;font-size:28px;font-weight:800;letter-spacing:8px;color:#006241;">${opts.otp}</span>
    </div>
    <p style="color:#ef4444;font-size:13px;">This code expires in 15 minutes. If you did not request a password reset, please ignore this email.</p>
  `

  return { subject, html: renderEmailLayout(body, 'Your password reset code.') }
}

