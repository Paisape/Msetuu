import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sendEmail } from '@/libs/email'
import { reviewApprovedEmail } from '@/libs/emailTemplates'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED'])

// PATCH /api/reviews/[id] — admin moderates a review (approve/reject). Status is the only
// field an admin can change here; the review content itself stays exactly as the customer wrote it.
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'status must be PENDING, APPROVED or REJECTED.' }, { status: 400 })
    }

    const existing = await prisma.review.findUnique({ where: { id }, include: { user: { select: { email: true } } } })

    if (!existing) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })

    const review = await prisma.review.update({ where: { id }, data: { status } })

    // Notify the customer only on the transition INTO approved — not on every re-save.
    if (status === 'APPROVED' && existing.status !== 'APPROVED' && existing.user?.email) {
      const { subject, html } = reviewApprovedEmail({
        customerName: existing.customerName,
        itemLabel: existing.targetTitle,
        rating: existing.rating
      })

      await sendEmail({ to: existing.user.email, subject, html })
    }

    return NextResponse.json(review)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.review.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
