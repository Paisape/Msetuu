import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { getSettingOrEnv } from '@/libs/appSettings'

// POST /api/my-referrals/payout — creates a bank/UPI withdrawal request
export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const amount = Number(body.amount)
    const { bankHolderName, bankName, accountNumber, ifscCode, upiId } = body

    // 1. Basic validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid payout amount.' }, { status: 400 })
    }

    if (!bankHolderName || !bankName || !accountNumber || !ifscCode) {
      return NextResponse.json({ error: 'Please provide all required bank account details.' }, { status: 400 })
    }

    // 2. Fetch minimum payout limit setting
    const minPayoutStr = await getSettingOrEnv('REFERRAL', 'REFERRAL_MIN_PAYOUT', 'REFERRAL_MIN_PAYOUT')
    const minPayoutLimit = Number(minPayoutStr || '500')

    if (amount < minPayoutLimit) {
      return NextResponse.json({ error: `Minimum payout request limit is ₹${minPayoutLimit}.` }, { status: 400 })
    }

    // 3. Fetch latest user wallet balance directly from DB to prevent race conditions/stale reads
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralWalletBalance: true }
    })

    if (!dbUser || dbUser.referralWalletBalance < amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance for this payout.' }, { status: 400 })
    }

    // 4. Advanced Anti-Fraud check: Bank Account & UPI ID Uniqueness
    // Enforce that no other user has requested a payout to this exact same bank account
    // or UPI ID. This prevents Sybil/duplicate account exploits where a single user
    // creates multiple referrals to cash out to the same destination bank.
    const duplicateBankRequest = await prisma.payoutRequest.findFirst({
      where: {
        accountNumber,
        userId: { not: user.id },
        status: { in: ['PENDING', 'APPROVED', 'PAID'] }
      }
    })

    if (duplicateBankRequest) {
      console.warn(`[Referral Anti-Fraud] Blocked duplicate bank account payout. User: ${user.id}, Account: ${accountNumber}`)
      return NextResponse.json({
        error: 'This bank account is already associated with another active payout request. Please use your own verified account.'
      }, { status: 400 })
    }

    if (upiId) {
      const duplicateUpiRequest = await prisma.payoutRequest.findFirst({
        where: {
          upiId,
          userId: { not: user.id },
          status: { in: ['PENDING', 'APPROVED', 'PAID'] }
        }
      })

      if (duplicateUpiRequest) {
        console.warn(`[Referral Anti-Fraud] Blocked duplicate UPI ID payout. User: ${user.id}, UPI: ${upiId}`)
        return NextResponse.json({
          error: 'This UPI ID is already associated with another active payout request.'
        }, { status: 400 })
      }
    }

    // 5. Create PayoutRequest and deduct balance atomically
    const request = await (prisma as any).$transaction(async (tx: any) => {
      // Deduct balance
      await tx.user.update({
        where: { id: user.id },
        data: {
          referralWalletBalance: {
            decrement: amount
          }
        }
      })

      // Create request
      return tx.payoutRequest.create({
        data: {
          userId: user.id,
          amount,
          status: 'PENDING',
          bankHolderName,
          bankName,
          accountNumber,
          ifscCode,
          upiId: upiId || null
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully.',
      payoutId: request.id
    })

  } catch (err) {
    return handleApiError(err)
  }
}
