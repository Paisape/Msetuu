import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getPointsPerTag } from '@/libs/geotagPoints'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/geotag/[id] — admin approves or rejects a pending tag.
// { status: 'APPROVED' | 'REJECTED' }
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json({ error: "status must be 'APPROVED' or 'REJECTED'." }, { status: 400 })
    }

    const tag = await prisma.geoTagPhoto.findUnique({ where: { id } })

    if (!tag) return NextResponse.json({ error: 'Tag not found.' }, { status: 404 })

    if (tag.status !== 'PENDING') {
      return NextResponse.json({ error: `This tag was already ${tag.status.toLowerCase()}.` }, { status: 409 })
    }

    if (status === 'REJECTED') {
      const rejected = await prisma.geoTagPhoto.update({
        where: { id },
        data: { status: 'REJECTED', reviewedAt: new Date() }
      })

      return NextResponse.json(rejected)
    }

    // APPROVED — award points atomically: bump the cached balance, log the ledger entry, and
    // mark the tag reviewed, all together so a crash mid-way can't award points without a
    // ledger row (or vice versa).
    const pointsPerTag = await getPointsPerTag()

    const [, , approved] = await prisma.$transaction([
      prisma.user.update({ where: { id: tag.userId }, data: { points: { increment: pointsPerTag } } }),
      prisma.pointsTransaction.create({
        data: {
          userId: tag.userId,
          amount: pointsPerTag,
          reason: `Geotag approved: ${tag.templeName || 'temple visit'}`,
          geoTagId: tag.id
        }
      }),
      prisma.geoTagPhoto.update({
        where: { id },
        data: { status: 'APPROVED', pointsAwarded: pointsPerTag, reviewedAt: new Date() }
      })
    ])

    return NextResponse.json(approved)
  } catch (err) {
    return handleApiError(err)
  }
}
