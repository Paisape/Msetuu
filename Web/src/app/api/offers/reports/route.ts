import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// GET /api/offers/reports - Fetch campaign reports, bookings, and referral statistics (Admin only)
export async function GET(req: Request) {
  try {
    await requireUser()

    const { searchParams } = new URL(req.url)
    const offerLinkId = searchParams.get('offerLinkId')

    // 1. Fetch campaigns for filter dropdown
    const campaigns = await prisma.offerLink.findMany({
      select: { id: true, title: true, slug: true, offerPrice: true }
    })

    if (campaigns.length === 0) {
      return NextResponse.json({ campaigns: [], stats: null, orders: [], referrals: [] })
    }

    const selectedId = offerLinkId || campaigns[0].id

    // 2. Fetch traffic, orders, and conversion statistics
    const [viewsCount, totalOrders, successfulOrders] = await Promise.all([
      prisma.offerLinkAnalytics.count({ where: { offerLinkId: selectedId } }),
      prisma.offerLinkOrder.count({ where: { offerLinkId: selectedId } }),
      prisma.offerLinkOrder.findMany({
        where: { offerLinkId: selectedId, paymentStatus: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        include: {
          devotees: true
        }
      })
    ])

    const totalRevenue = successfulOrders.reduce((sum: number, o: { amount: any }) => sum + Number(o.amount), 0)
    const conversionRate = viewsCount > 0 ? (successfulOrders.length / viewsCount) * 100 : 0

    const stats = {
      viewsCount,
      bookingsCount: successfulOrders.length,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    }

    // 3. Compile referral code tracking statistics for the selected campaign
    const ordersWithRef = await prisma.offerLinkOrder.findMany({
      where: {
        offerLinkId: selectedId,
        paymentStatus: 'SUCCESS',
        referralCode: { not: null }
      },
      select: {
        amount: true,
        referralCode: true
      }
    })

    // Fetch referral settings
    const partnerCodes = await prisma.referralCode.findMany()

    // Aggregate counts & commissions
    const referralAggMap: Record<string, { code: string; partnerName: string; count: number; totalRevenue: number; commission: number }> = {}
    
    partnerCodes.forEach((ref: { code: string; partnerName: string }) => {
      referralAggMap[ref.code] = {
        code: ref.code,
        partnerName: ref.partnerName,
        count: 0,
        totalRevenue: 0,
        commission: 0
      }
    })

    ordersWithRef.forEach((order: { referralCode: string | null; amount: any }) => {
      const code = order.referralCode!
      const orderAmount = Number(order.amount)
      
      if (!referralAggMap[code]) {
        // Fallback if referral code was deleted from directories later but exists in order logs
        referralAggMap[code] = {
          code,
          partnerName: 'Deleted Partner',
          count: 0,
          totalRevenue: 0,
          commission: 0
        }
      }

      const partner = referralAggMap[code]
      const matchingCodeSettings = partnerCodes.find((p: { code: string }) => p.code === code)
      const commissionRate = matchingCodeSettings ? Number(matchingCodeSettings.commissionRate) : 10.00

      partner.count++
      partner.totalRevenue += orderAmount
      partner.commission += commissionRate
    })

    const referrals = Object.values(referralAggMap).filter((p: { count: number }) => p.count > 0)

    return NextResponse.json({
      campaigns,
      selectedId,
      stats,
      orders: successfulOrders,
      referrals
    })
  } catch (err) {
    return handleApiError(err)
  }
}
