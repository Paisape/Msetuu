import prisma from './prisma'
import { getSettingOrEnv } from './appSettings'
import { sendReferralCommissionEmail } from './referralEmails'

/**
 * Generate a unique referral code for a new user.
 * Format: PAPE + 6 random alphanumeric characters (e.g. PAPE8F2A9K)
 */
export async function generateUniqueReferralCode(): Promise<string> {
  let uniqueCode = ''
  let attempts = 0
  const maxAttempts = 10

  while (!uniqueCode && attempts < maxAttempts) {
    const candidate = 'PAPE' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const exists = await prisma.user.findUnique({
      where: { referralCode: candidate }
    })
    
    if (!exists) {
      uniqueCode = candidate
    }
    attempts++
  }

  // Fallback if random attempts collision (extremely rare)
  if (!uniqueCode) {
    uniqueCode = 'PAPE' + Date.now().toString(36).substring(3, 9).toUpperCase()
  }

  return uniqueCode
}

/**
 * Enforces anti-fraud checks during signup mapping
 */
export async function validateReferrer(referrerCode: string, newUserEmail: string, newUserPhone?: string): Promise<string | null> {
  if (!referrerCode) return null

  const referrer = await prisma.user.findUnique({
    where: { referralCode: referrerCode }
  })

  if (!referrer) return null

  // 1. Self-referral block
  if (referrer.email?.toLowerCase() === newUserEmail.toLowerCase()) {
    console.warn(`[Referral Anti-Fraud] Blocked self-referral for email: ${newUserEmail}`)
    return null
  }

  if (newUserPhone && referrer.phone === newUserPhone) {
    console.warn(`[Referral Anti-Fraud] Blocked self-referral for phone: ${newUserPhone}`)
    return null
  }

  return referrer.id
}

/**
 * Process signup reward commission when a new user successfully verifies their account
 */
export async function processSignupReferral(newUserId: string) {
  try {
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId }
    })

    if (!newUser || !newUser.referredById) return

    const referrer = await prisma.user.findUnique({
      where: { id: newUser.referredById }
    })

    if (!referrer) return

    // Double-check if we already paid a signup reward for this user
    const existing = await prisma.referralLedger.findFirst({
      where: {
        referrerId: referrer.id,
        referredUserId: newUser.id,
        type: 'SIGNUP'
      }
    })

    if (existing) return

    // 1. Check if referral system is enabled globally
    const systemEnabled = (await getSettingOrEnv('REFERRAL', 'REFERRAL_SYSTEM_ENABLED', 'REFERRAL_SYSTEM_ENABLED')) === 'true'
    if (!systemEnabled) return

    // 2. Determine reward amount (User-specific override or global default)
    let rewardAmount = referrer.refCommissionSignup
    
    if (rewardAmount === null || rewardAmount === undefined) {
      const defaultRewardStr = await getSettingOrEnv('REFERRAL', 'REFERRAL_SIGNUP_REWARD', 'REFERRAL_SIGNUP_REWARD')
      rewardAmount = Number(defaultRewardStr || '0')
    }

    if (rewardAmount <= 0) return

    // 3. Credit reward inside atomic transaction
    await (prisma as any).$transaction(async (tx: any) => {
      // Create ledger entry
      await tx.referralLedger.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUser.id,
          amount: rewardAmount!,
          type: 'SIGNUP',
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      })

      // Increment wallet balance
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          referralWalletBalance: {
            increment: rewardAmount!
          }
        }
      })
    })

    // 4. Send email notification to referrer
    if (referrer.email) {
      await sendReferralCommissionEmail(
        referrer.email,
        referrer.name || 'Referrer',
        rewardAmount,
        newUser.name || 'Your Friend',
        referrer.referralWalletBalance + rewardAmount,
        'SIGNUP'
      ).catch(err => console.error('[Referral Engine] Email notify failed:', err))
    }

    console.log(`[Referral Engine] Successfully rewarded ${referrer.email} with ₹${rewardAmount} for referring ${newUser.email}`)

  } catch (err) {
    console.error('[Referral Engine] processSignupReferral failed:', err)
  }
}

/**
 * Calculate purchase commission rate (uses user override or fallback to default)
 */
async function resolveOrderCommission(
  referrerId: string, 
  orderAmount: number, 
  isFirstOrder: boolean
): Promise<{ amount: number; rateLabel: string }> {
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId }
  })

  if (!referrer) return { amount: 0, rateLabel: '0%' }

  let typeKey = isFirstOrder ? 'REFERRAL_FIRST_ORDER_REWARD_TYPE' : 'REFERRAL_RECURRING_REWARD_TYPE'
  let valKey = isFirstOrder ? 'REFERRAL_FIRST_ORDER_REWARD' : 'REFERRAL_RECURRING_REWARD'
  
  // Custom user overrides
  const customRate = isFirstOrder ? referrer.refCommissionFirst : referrer.refCommissionRecurring

  let rewardType = 'PERCENTAGE'
  let rewardVal = 0

  if (customRate !== null && customRate !== undefined) {
    // Custom user overrides are always treated as FLAT amount or PERCENTAGE based on global type configuration
    rewardType = await getSettingOrEnv('REFERRAL', typeKey, typeKey) || 'PERCENTAGE'
    rewardVal = customRate
  } else {
    rewardType = await getSettingOrEnv('REFERRAL', typeKey, typeKey) || 'PERCENTAGE'
    const valStr = await getSettingOrEnv('REFERRAL', valKey, valKey)
    rewardVal = Number(valStr || '0')
  }

  if (rewardVal <= 0) return { amount: 0, rateLabel: '0' }

  if (rewardType === 'PERCENTAGE') {
    const amount = (orderAmount * rewardVal) / 100
    return { amount, rateLabel: `${rewardVal}%` }
  } else {
    return { amount: rewardVal, rateLabel: `₹${rewardVal}` }
  }
}

/**
 * Handle commission log when a referred user pays for an order (Pending Status)
 */
export async function logOrderPaymentCommission(orderId: string, userId: string, orderAmount: number) {
  try {
    const systemEnabled = (await getSettingOrEnv('REFERRAL', 'REFERRAL_SYSTEM_ENABLED', 'REFERRAL_SYSTEM_ENABLED')) === 'true'
    if (!systemEnabled) return

    const buyer = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!buyer || !buyer.referredById) return

    // Enforce anti-fraud double safety check
    if (buyer.referredById === buyer.id) return

    // 1. Determine if this is the buyer's first completed/paid order
    const paidOrdersCount = await prisma.referralLedger.count({
      where: {
        referredUserId: buyer.id,
        type: { in: ['FIRST_ORDER', 'RECURRING_ORDER'] },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    })

    const isFirstOrder = paidOrdersCount === 0

    // 2. Resolve commission rate
    const { amount, rateLabel } = await resolveOrderCommission(buyer.referredById, orderAmount, isFirstOrder)

    if (amount <= 0) return

    // 3. Log as PENDING commission
    await prisma.referralLedger.create({
      data: {
        referrerId: buyer.referredById,
        referredUserId: buyer.id,
        amount,
        type: isFirstOrder ? 'FIRST_ORDER' : 'RECURRING_ORDER',
        status: 'PENDING',
        orderId
      }
    })

    console.log(`[Referral Engine] Logged PENDING commission of ₹${amount} (${rateLabel}) for referrer on order ${orderId}`)

  } catch (err) {
    console.error('[Referral Engine] logOrderPaymentCommission failed:', err)
  }
}

/**
 * Confirm pending commission to withdrawable status once the order is fully completed/delivered
 */
export async function confirmOrderCommission(orderId: string) {
  try {
    const ledger = await prisma.referralLedger.findFirst({
      where: { orderId, status: 'PENDING' }
    })

    if (!ledger) return

    const referrer = await prisma.user.findUnique({
      where: { id: ledger.referrerId }
    })

    const buyer = await prisma.user.findUnique({
      where: { id: ledger.referredUserId }
    })

    if (!referrer || !buyer) return

    // Update inside atomic transaction
    await (prisma as any).$transaction(async (tx: any) => {
      // 1. Mark transaction as CONFIRMED
      await tx.referralLedger.update({
        where: { id: ledger.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      })

      // 2. Add to user wallet balance
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          referralWalletBalance: {
            increment: ledger.amount
          }
        }
      })
    })

    // Send email notification to referrer
    if (referrer.email) {
      await sendReferralCommissionEmail(
        referrer.email,
        referrer.name || 'Referrer',
        ledger.amount,
        buyer.name || 'Your Friend',
        referrer.referralWalletBalance + ledger.amount,
        ledger.type as any
      ).catch(err => console.error('[Referral Engine] Email notify failed:', err))
    }

    console.log(`[Referral Engine] Confirmed commission of ₹${ledger.amount} on order ${orderId} for ${referrer.email}`)

  } catch (err) {
    console.error('[Referral Engine] confirmOrderCommission failed:', err)
  }
}

/**
 * Cancel or Clawback commission if an order is cancelled or refunded
 */
export async function clawbackOrderCommission(orderId: string) {
  try {
    const ledger = await prisma.referralLedger.findFirst({
      where: { orderId, status: { in: ['PENDING', 'CONFIRMED'] } }
    })

    if (!ledger) return

    const referrer = await prisma.user.findUnique({
      where: { id: ledger.referrerId }
    })

    if (!referrer) return

    await (prisma as any).$transaction(async (tx: any) => {
      // 1. Mark existing ledger entry as CANCELLED
      await tx.referralLedger.update({
        where: { id: ledger.id },
        data: {
          status: 'CANCELLED'
        }
      })

      // 2. If it was already CONFIRMED, we must deduct the amount from the referrer's wallet
      if (ledger.status === 'CONFIRMED') {
        // Log a clawback transaction for audit safety
        await tx.referralLedger.create({
          data: {
            referrerId: referrer.id,
            referredUserId: ledger.referredUserId,
            amount: -ledger.amount,
            type: 'CLAWBACK',
            status: 'CONFIRMED',
            orderId,
            confirmedAt: new Date()
          }
        })

        // Decrement wallet balance (ensure it doesn't go below 0, or allow negative balance if withdrawn)
        await tx.user.update({
          where: { id: referrer.id },
          data: {
            referralWalletBalance: {
              decrement: ledger.amount
            }
          }
        })
      }
    })

    console.log(`[Referral Engine] Clawed back commission of ₹${ledger.amount} on order ${orderId} due to cancellation/refund.`)

  } catch (err) {
    console.error('[Referral Engine] clawbackOrderCommission failed:', err)
  }
}
