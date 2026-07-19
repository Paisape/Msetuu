import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/contact-submissions/[id] — admin toggles `handled` to track which inquiries still
// need a reply.
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { handled } = body

    const data: Record<string, unknown> = {}

    if (handled !== undefined) data.handled = Boolean(handled)

    const submission = await prisma.contactSubmission.update({ where: { id }, data })

    return NextResponse.json(submission)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params

    await prisma.contactSubmission.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
