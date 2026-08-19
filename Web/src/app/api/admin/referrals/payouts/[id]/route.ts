import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { notifyUser } from '@/libs/notificationSystem'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/admin/referrals/payouts/[id] — update payout status (Approve / Paid / Reject)
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { status, adminNotes } = body

    if (!status || !['PENDING', 'APPROVED', 'PAID', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payout status.' }, { status: 400 })
    }

    const request = await prisma.payoutRequest.findUnique({
      where: { id }
    })

    if (!request) {
      return NextResponse.json({ error: 'Payout request not found.' }, { status: 404 })
    }

    // Guard: Prevent modifying an already settled/paid/rejected request
    if (request.status === 'PAID' || request.status === 'REJECTED') {
      return NextResponse.json({ error: 'This payout request has already been settled and cannot be modified.' }, { status: 400 })
    }

    const updatedRequest = await (prisma as any).$transaction(async (tx: any) => {
      // If the payout is rejected, return the funds back to the user's wallet
      if (status === 'REJECTED' && request.status !== 'REJECTED') {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            referralWalletBalance: {
              increment: request.amount
            }
          }
        })
      }

      return tx.payoutRequest.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes || request.adminNotes,
          processedAt: ['PAID', 'REJECTED'].includes(status) ? new Date() : null
        }
      })
    })

    // Notify the user about payout status update (non-blocking best-effort)
    try {
      let message = ''

      if (status === 'APPROVED') {
        message = `Your payout request of ₹${request.amount} has been approved.`
      } else if (status === 'PAID') {
        message = `Your payout request of ₹${request.amount} has been successfully paid to your account.`
      } else if (status === 'REJECTED') {
        message = `Your payout request of ₹${request.amount} was rejected and refunded to your wallet.`
      }

      if (message) {
        await notifyUser(request.userId, 'Referral Payout Update', message, ['email', 'firebase', 'whatsapp'])
      }
    } catch (e) {
      console.error('[Payout Notification] Failed to notify user:', e)
    }

    return NextResponse.json({
      success: true,
      message: `Payout request marked as ${status} successfully.`,
      payout: updatedRequest
    })

  } catch (err) {
    return handleApiError(err)
  }
}
