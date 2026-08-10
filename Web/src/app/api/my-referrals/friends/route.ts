import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

function maskName(name: string): string {
  if (!name) return 'Customer'
  const parts = name.split(' ')
  return parts
    .map(p => {
      if (p.length <= 2) return p
      return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1]
    })
    .join(' ')
}

function maskEmail(email: string): string {
  if (!email) return ''
  const [username, domain] = email.split('@')
  if (!domain) return email
  if (username.length <= 2) return `*@${domain}`
  return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`
}

// GET /api/my-referrals/friends — lists customer's referred friends (with privacy masking)
export async function GET() {
  try {
    const user = await requireUser()

    const friends = await prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailVerified: true,
        referralTransactions: {
          where: { status: 'CONFIRMED' },
          select: { type: true, amount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedFriends = friends.map((friend: any) => {
      const hasPurchased = friend.referralTransactions.some((t: any) =>
        t.type === 'FIRST_ORDER' || t.type === 'RECURRING_ORDER'
      )

      let referralStatus = 'Signed Up'
      if (!friend.emailVerified) {
        referralStatus = 'Pending Verification'
      } else if (hasPurchased) {
        referralStatus = 'Active Buyer'
      } else {
        referralStatus = 'Verified Member'
      }

      const totalRevenueGenerated = friend.referralTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)

      return {
        id: friend.id,
        name: maskName(friend.name || ''),
        email: maskEmail(friend.email || ''),
        status: referralStatus,
        revenueEarned: totalRevenueGenerated,
        createdAt: friend.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      friends: formattedFriends
    })
  } catch (err) {
    return handleApiError(err)
  }
}
