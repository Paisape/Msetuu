import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/devotees - Admin-only devotee directory listing
export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim().toLowerCase() || ''

    const devotees = await prisma.offerLinkDevotee.findMany({
      orderBy: { id: 'desc' },
      include: {
        order: {
          select: {
            referralCode: true
          }
        }
      }
    })

    const mapped = devotees.map((dev: any) => ({
      id: dev.id,
      name: dev.name,
      nameLocal: dev.nameLocal,
      mobile: dev.phone,
      gotra: dev.gotra || '—',
      dob: dev.dob || '—',
      email: dev.email || '—', // Conceptual field reuse for WhatsApp
      referredBy: dev.order?.referralCode || '—',
      orderId: dev.orderId
    }))

    const filtered = mapped.filter((d: any) => {
      if (!q) return true
      return (d.name && d.name.toLowerCase().includes(q)) || 
        (d.nameLocal && d.nameLocal.toLowerCase().includes(q)) || 
        (d.mobile && d.mobile.includes(q)) || 
        (d.gotra && d.gotra.toLowerCase().includes(q)) || 
        (d.referredBy && d.referredBy.toLowerCase().includes(q))
    })

    // Add S.no to the filtered results
    const results = filtered.map((d: any, idx: number) => ({
      ...d,
      sNo: idx + 1
    }))

    return NextResponse.json(results)
  } catch (err) {
    return handleApiError(err)
  }
}
