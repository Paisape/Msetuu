import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const referral = await prisma.referralCode.findUnique({
      where: { code: code.trim().toUpperCase() }
    })

    if (!referral) {
      return NextResponse.json({ partnerName: null })
    }

    return NextResponse.json({ partnerName: referral.partnerName })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
