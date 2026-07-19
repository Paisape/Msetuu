import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/contact-submissions — admin-only list of every Contact Us inquiry, newest first.
export async function GET() {
  try {
    await requireAdmin()

    const submissions = await prisma.contactSubmission.findMany({ orderBy: { createdAt: 'desc' } })

    return NextResponse.json(submissions)
  } catch (err) {
    return handleApiError(err)
  }
}
