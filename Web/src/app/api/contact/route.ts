import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'
import { contactFormNotificationEmail } from '@/libs/emailTemplates'

const NAME_MAX_LEN = 100
const EMAIL_MAX_LEN = 254
const MESSAGE_MAX_LEN = 3000
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/contact — public Contact Us form submission. No auth required (this is the site's
// public inquiry channel), but every field is validated and length-capped server-side before
// ever reaching an email template, since this is the one place free-form text from an anonymous
// visitor flows into an outgoing email.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
    }

    if (name.length > NAME_MAX_LEN || email.length > EMAIL_MAX_LEN || message.length > MESSAGE_MAX_LEN) {
      return NextResponse.json({ error: 'One or more fields exceed the maximum allowed length.' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 })
    }

    // Persist first — the inquiry itself must never be lost even if the notification email
    // below fails to send (SMTP outage, misconfigured Config > Email settings, etc).
    await prisma.contactSubmission.create({ data: { name, email, message } })

    const recipient = process.env.CONTACT_FORM_EMAIL || 'info@mandirsetuu.com'
    const { subject, html } = contactFormNotificationEmail({ name, email, message })

    const result = await sendEmail({ to: recipient, subject, html })

    if (!result.sent) {
      // The message is safely stored and visible to admin under Content Management > Contact
      // Messages — only the notification email failed, so this is not a hard failure for the
      // visitor submitting the form.
      console.error('[contact] Saved submission but failed to send notification email:', result.reason)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Unexpected error:', err)

    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 })
  }
}
