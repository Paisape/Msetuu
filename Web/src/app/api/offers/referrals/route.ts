import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/offers/referrals - List all referral codes (Admin only)
export async function GET() {
  try {
    await requireUser()

    const referrals = await prisma.referralCode.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(referrals)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/offers/referrals - Create a partner referral code (Admin only)
export async function POST(req: Request) {
  try {
    await requireUser()

    const body = await req.json()
    const { code, partnerName, commissionRate } = body

    if (!code || !partnerName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (cleanCode.length === 0) {
      return NextResponse.json({ error: 'Referral code must contain alphanumeric characters.' }, { status: 400 })
    }

    const existing = await prisma.referralCode.findUnique({ where: { code: cleanCode } })
    if (existing) {
      return NextResponse.json({ error: 'This referral code is already in use.' }, { status: 400 })
    }

    const referral = await prisma.referralCode.create({
      data: {
        code: cleanCode,
        partnerName: partnerName.trim(),
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : 10.00
      }
    })

    return NextResponse.json({ success: true, referral })
  } catch (err) {
    return handleApiError(err)
  }
}
