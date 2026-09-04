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
                Need help? Reply to this email or contact us at <a href="mailto:admin@mandirsetuu.com" style="color:${BRAND_GREEN};">admin@mandirsetuu.com</a>.<br />
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
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg, ${BRAND_GREEN} 0%, #006241 100%);color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:999px;">${text}</a>
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

export function welcomePhoneVerificationEmail(opts: { customerName: string; phone: string; otp: string }): { subject: string; html: string } {
  const subject = 'Welcome to Mandirsetuu — Please verify your mobile number'

  const body = `
    <p>Namaste ${opts.customerName},</p>
    <p>Welcome to Mandirsetuu! Please verify your mobile number <strong>${opts.phone}</strong> to complete your registration.</p>
    <p>Enter this one-time code on the verification page under Mobile Code:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:12px;padding:16px 32px;font-size:28px;font-weight:800;letter-spacing:8px;color:#006241;">${opts.otp}</span>
    </div>
    <p style="color:#ef4444;font-size:13px;">This code expires in 15 minutes.</p>
  `

  return { subject, html: renderEmailLayout(body, 'Your mobile verification code.') }
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

export function adminLoginOtpEmail(opts: { otp: string }): { subject: string; html: string } {
  const subject = 'Mandirsetuu Admin — OTP Code for Login Verification'

  const body = `
    <p>Namaste Admin,</p>
    <p>A sign-in request was made for your Mandirsetuu Admin account.</p>
    <p>Please enter this 6-digit one-time code to complete your login verification:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:rgba(0,98,65,0.08);border:1px solid rgba(0,98,65,0.25);border-radius:12px;padding:16px 32px;font-size:28px;font-weight:800;letter-spacing:8px;color:#006241;">${opts.otp}</span>
    </div>
    <p style="color:#ef4444;font-size:13px;">This code expires in 10 minutes. If you did not request this login, secure your password immediately.</p>
  `

  return { subject, html: renderEmailLayout(body, 'Your admin login verification code.') }
}

export function passwordlessOtpEmail(opts: { otp: string }): { subject: string; html: string } {
  const subject = 'Mandirsetuu — Your Login Verification Code'

  const body = `
    <p>Namaste,</p>
    <p>A login request was made for your Mandirsetuu account.</p>
    <p>Please enter this 6-digit one-time code to log in:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:rgba(0,98,65,0.08);border:1px solid rgba(0,98,65,0.25);border-radius:12px;padding:16px 32px;font-size:28px;font-weight:800;letter-spacing:8px;color:#006241;">${opts.otp}</span>
    </div>
    <p style="color:#ef4444;font-size:13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
  `

  return { subject, html: renderEmailLayout(body, 'Your login verification code.') }
}

export function adminOfferBookingSuccessEmail(opts: {
  orderId: string
  campaignTitle: string
  amount: number
  paymentId: string
  paymentMethod: string
  referralCode?: string | null
  displayCounter: number
  devotees: {
    name: string
    nameLocal?: string | null
    gotra?: string
    dob?: string
    phone?: string
    email?: string | null
    locality?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    isPrimary?: boolean
  }[]
  createdAt: Date
}): { subject: string; html: string } {
  const subject = `🚩 New Campaign Booking: ${opts.campaignTitle} (₹${opts.amount.toFixed(0)}) - Order #${opts.orderId.slice(0, 8).toUpperCase()}`

  const devoteesHtml = opts.devotees
    .map(
      (d, i) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px; font-weight: bold; color: #1e293b;">${i + 1}. ${d.name} ${d.nameLocal ? `<span style="color:#64748b;font-weight:normal;">(${d.nameLocal})</span>` : ''} ${d.isPrimary ? '<span style="background:#ff671f;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:bold;margin-left:4px;">PRIMARY</span>' : ''}</td>
      <td style="padding: 10px; color: #334155; font-family: monospace;">${d.phone || '—'}</td>
      <td style="padding: 10px; color: #334155;">${d.gotra || '—'} / ${d.dob || '—'}</td>
      <td style="padding: 10px; color: #334155;">${[d.locality, d.city, d.state, d.pincode].filter(Boolean).join(', ') || '—'}</td>
    </tr>
  `
    )
    .join('')

  const body = `
    <div style="background-color:#fff7ed;border:1px solid #ffedd5;padding:16px;border-radius:12px;margin-bottom:20px;text-align:center;">
      <h2 style="margin:0;color:#c2410c;font-size:20px;font-weight:800;">🚩 New Campaign Booking Confirmed!</h2>
      <p style="margin:6px 0 0;color:#ea580c;font-size:14px;font-weight:bold;">${opts.campaignTitle}</p>
    </div>

    <!-- Counter Status Banner -->
    <div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#ffffff;padding:14px 20px;border-radius:10px;margin-bottom:24px;text-align:center;font-weight:bold;font-size:16px;">
      🚩 Live Campaign Counter: <span style="font-size:20px;font-weight:900;">${opts.displayCounter.toLocaleString('en-IN')}+ Devotees</span>
    </div>

    <!-- Order Summary Table -->
    <h3 style="color:#1e293b;margin:0 0 12px;font-size:16px;border-bottom:2px solid #f97316;padding-bottom:6px;">📋 Order & Payment Details</h3>
    <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:24px;background-color:#f8fafc;border-radius:10px;font-size:13px;border:1px solid #e2e8f0;">
      <tr>
        <td width="35%" style="color:#64748b;font-weight:bold;">Order ID:</td>
        <td style="font-family:monospace;font-weight:bold;color:#0f172a;">${opts.orderId}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-weight:bold;">Booking Date & Time:</td>
        <td style="color:#0f172a;">${opts.createdAt.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-weight:bold;">Total Amount Paid:</td>
        <td style="font-size:16px;font-weight:bold;color:#059669;">₹${opts.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-weight:bold;">Payment Gateway ID:</td>
        <td style="font-family:monospace;font-weight:bold;color:#0f172a;">${opts.paymentId}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-weight:bold;">Payment Method:</td>
        <td style="font-weight:bold;color:#3b82f6;">${opts.paymentMethod}</td>
      </tr>
      <tr>
        <td style="color:#64748b;font-weight:bold;">Referred By Partner:</td>
        <td style="font-weight:bold;color:#6366f1;">${opts.referralCode || 'Direct Booking'}</td>
      </tr>
    </table>

    <!-- Booked Devotees -->
    <h3 style="color:#1e293b;margin:0 0 12px;font-size:16px;border-bottom:2px solid #f97316;padding-bottom:6px;">👥 Booked Devotees (${opts.devotees.length})</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-size:12px;">
      <thead>
        <tr style="background-color:#f1f5f9;color:#475569;text-align:left;">
          <th style="padding:10px;">Devotee Name</th>
          <th style="padding:10px;">Mobile</th>
          <th style="padding:10px;">Gotra / DOB</th>
          <th style="padding:10px;">Locality & Address</th>
        </tr>
      </thead>
      <tbody>
        ${devoteesHtml}
      </tbody>
    </table>
  `

  return { subject, html: renderEmailLayout(body, `New Campaign Booking: ${opts.campaignTitle}`) }
}

export function devoteeOfferBookingInvoiceEmail(opts: {
  customerName: string
  campaignTitle: string
  amount: number
  orderId: string
  invoiceNumber: string
  paymentMethod?: string
  devotees: {
    name: string
    gotra?: string
    dob?: string
    city?: string | null
    state?: string | null
  }[]
  createdAt: Date
}): { subject: string; html: string } {
  const shortOrderId = opts.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  const subject = `🌸 Booking Confirmed & Receipt: ${opts.campaignTitle} (#MS-${shortOrderId})`
  const trackUrl = `${APP_URL}/t/?id=${shortOrderId}`

  const devoteesList = opts.devotees
    .map(
      (d, i) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${i + 1}. ${escapeHtml(d.name)}</td>
        <td style="padding: 10px 14px; color: #64748b;">${escapeHtml(d.gotra || '—')}</td>
        <td style="padding: 10px 14px; color: #64748b;">${escapeHtml([d.city, d.state].filter(Boolean).join(', ') || '—')}</td>
      </tr>
    `
    )
    .join('')

  const body = `
    <!-- Header Divine Banner -->
    <div style="background: linear-gradient(135deg, #fff7ed 0%, #ecfdf5 100%); border: 1.5px solid #fed7aa; padding: 22px 18px; border-radius: 14px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">🌸 🙏 ✨</div>
      <h2 style="margin: 0; color: #9a3412; font-size: 21px; font-weight: 800; letter-spacing: -0.2px;">Booking Confirmed & Blessed</h2>
      <p style="margin: 6px 0 0; color: #006241; font-size: 15px; font-weight: 700;">${escapeHtml(opts.campaignTitle)}</p>
    </div>

    <p style="font-size: 15px; color: #1f2937; line-height: 1.6; margin-bottom: 18px;">
      Namaste <strong>${escapeHtml(opts.customerName)}</strong> ji,<br />
      Thank you for your sacred offering. We are pleased to confirm that your puja seva booking has been successfully recorded. May the blessings of the divine almighty shower peace, prosperity, and spiritual fulfillment upon you and your family.
    </p>

    <!-- Official Booking Receipt Card -->
    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: #006241; color: #ffffff; padding: 12px 18px; display: table; width: 100%; box-sizing: border-box;">
        <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">Official Booking Receipt</span>
        <span style="float: right; background: #ffffff; color: #006241; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">PAID</span>
      </div>

      <table width="100%" cellpadding="10" cellspacing="0" style="font-size: 13px; border-collapse: collapse;">
        <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600; width: 42%;">Receipt / Invoice No.</td>
          <td style="color: #0f172a; font-weight: 800; text-align: right; font-family: monospace;">${escapeHtml(opts.invoiceNumber)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Order ID</td>
          <td style="color: #ea580c; font-weight: 800; text-align: right; font-family: monospace;">#MS-${shortOrderId}</td>
        </tr>
        <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Booking Date</td>
          <td style="color: #0f172a; text-align: right; font-weight: 600;">${opts.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Seva / Offering</td>
          <td style="color: #0f172a; font-weight: 700; text-align: right;">${escapeHtml(opts.campaignTitle)}</td>
        </tr>
        <tr style="background: #f8fafc; border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Total Devotees Booked</td>
          <td style="color: #0f172a; text-align: right; font-weight: 700;">${opts.devotees.length} Devotee(s)</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="color: #64748b; font-weight: 600;">Payment Mode</td>
          <td style="color: #0284c7; text-align: right; font-weight: 700;">${escapeHtml(opts.paymentMethod || 'Online (Razorpay)')}</td>
        </tr>
        <tr style="background: #fff7ed;">
          <td style="color: #9a3412; font-weight: 800; font-size: 14px;">Total Amount Paid</td>
          <td style="color: #006241; font-weight: 900; font-size: 18px; text-align: right;">₹${opts.amount.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <!-- Registered Devotees Table -->
    ${opts.devotees.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 10px; color: #1e293b; font-size: 14px; font-weight: 700;">👥 Devotee(s) for Puja Sankalp</h4>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; color: #475569; text-align: left; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 10px 14px;">Name</th>
              <th style="padding: 10px 14px;">Gotra</th>
              <th style="padding: 10px 14px;">City / State</th>
            </tr>
          </thead>
          <tbody>
            ${devoteesList}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- Live Tracking CTA -->
    <div style="text-align: center; margin: 30px 0 24px;">
      <a href="${trackUrl}" style="display: inline-block; background: linear-gradient(135deg, #006241 0%, #047857 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 34px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,98,65,0.25);">
        📍 Track Your Booking & Video Details
      </a>
      <p style="margin: 10px 0 0; font-size: 12px; color: #64748b;">
        Tracking URL: <a href="${trackUrl}" style="color: #006241; font-family: monospace; font-weight: 600;">${trackUrl}</a>
      </p>
    </div>

    <div style="background: #f0fdf4; border: 1px dashed #86efac; border-radius: 10px; padding: 14px; text-align: center; margin-top: 20px;">
      <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 500;">
        "ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥"
      </p>
    </div>
  `

  return { subject, html: renderEmailLayout(body, `Booking confirmed for ${opts.campaignTitle}. Receipt No: ${opts.invoiceNumber}`) }
}

