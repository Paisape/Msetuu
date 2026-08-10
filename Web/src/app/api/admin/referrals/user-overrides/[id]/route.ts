import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/referrals/user-overrides/[id] — get user custom referral config
export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        refCommissionSignup: true,
        refCommissionFirst: true,
        refCommissionRecurring: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/admin/referrals/user-overrides/[id] — update user custom referral overrides
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    // Read override values. null means delete override and inherit global defaults.
    const refCommissionSignup = body.refCommissionSignup !== undefined ? (body.refCommissionSignup === null ? null : Number(body.refCommissionSignup)) : undefined
    const refCommissionFirst = body.refCommissionFirst !== undefined ? (body.refCommissionFirst === null ? null : Number(body.refCommissionFirst)) : undefined
    const refCommissionRecurring = body.refCommissionRecurring !== undefined ? (body.refCommissionRecurring === null ? null : Number(body.refCommissionRecurring)) : undefined

    const updateData: Record<string, any> = {}
    if (refCommissionSignup !== undefined) updateData.refCommissionSignup = refCommissionSignup
    if (refCommissionFirst !== undefined) updateData.refCommissionFirst = refCommissionFirst
    if (refCommissionRecurring !== undefined) updateData.refCommissionRecurring = refCommissionRecurring

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        refCommissionSignup: true,
        refCommissionFirst: true,
        refCommissionRecurring: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User-specific referral overrides updated successfully.',
      user
    })
  } catch (err) {
    return handleApiError(err)
  }
}
