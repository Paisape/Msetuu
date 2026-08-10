import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { generateUniqueReferralCode } from '@/libs/referralEngine'
import { getSettingOrEnv } from '@/libs/appSettings'

// GET /api/my-referrals/stats — loads customer's referral dashboard stats & ledger
export async function GET() {
  try {
    const user = await requireUser() as any

    // 1. Double-safety check: Ensure user has a referral code generated
    let referralCode = user.referralCode
    if (!referralCode) {
      referralCode = await generateUniqueReferralCode()
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode }
      })
    }

    // 2. Fetch referred users count
    const totalInvites = await prisma.user.count({
      where: { referredById: user.id }
    })

    // 3. Fetch earnings transactions history
    const earnings = await prisma.referralLedger.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // 4. Fetch payout requests history
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // 5. Fetch minimum payout limit setting
    const minPayoutStr = await getSettingOrEnv('REFERRAL', 'REFERRAL_MIN_PAYOUT', 'REFERRAL_MIN_PAYOUT')
    const minPayoutLimit = Number(minPayoutStr || '500')

    // Calculate statistics
    const totalEarned = earnings
      .filter((e: any) => e.status === 'CONFIRMED')
      .reduce((sum: number, e: any) => sum + e.amount, 0)

    const totalWithdrawn = payouts
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    const pendingPayout = payouts
      .filter((p: any) => p.status === 'PENDING' || p.status === 'APPROVED')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Calculate active buyers count
    const activeBuyers = await prisma.user.count({
      where: {
        referredById: user.id,
        referralTransactions: {
          some: {
            type: { in: ['FIRST_ORDER', 'RECURRING_ORDER'] },
            status: 'CONFIRMED'
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      referralCode,
      walletBalance: user.referralWalletBalance || 0,
      totalInvites,
      activeBuyers,
      totalEarned,
      totalWithdrawn,
      pendingPayout,
      minPayoutLimit,
      earnings,
      payouts
    })
  } catch (err) {
    return handleApiError(err)
  }
}
