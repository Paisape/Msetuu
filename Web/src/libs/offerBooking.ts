/**
 * Core Offer Link Booking Confirmation & Multi-Channel Notification Engine
 * Centralized service to handle order payment confirmation, GST invoice creation,
 * DLT SMS dispatch, and admin/devotee email notifications.
 */

import prisma from '@/libs/prisma'
import { createInvoiceForOrder } from '@/libs/invoice'
import { paymentSuccessEmail, adminOfferBookingSuccessEmail } from '@/libs/emailTemplates'
import { sendEmail } from '@/libs/email'
import { sendOrderConfirmationSms } from '@/libs/sms'
import { getSettingsForCategory } from '@/libs/appSettings'

export interface ConfirmOfferBookingOptions {
  orderId: string
  paymentId?: string
  paymentMethod?: string
  paymentDetails?: any
  reconciledStatus?: 'RECONCILED_AUTO' | 'RECONCILED_MANUAL' | 'UNRECONCILED' | 'DISCREPANCY'
  notes?: string
}

export async function confirmOfferBookingAndNotify(opts: ConfirmOfferBookingOptions) {
  const {
    orderId,
    paymentId,
    paymentMethod = 'ONLINE',
    paymentDetails,
    reconciledStatus = 'RECONCILED_AUTO',
    notes
  } = opts

  // 1. Fetch the existing order
  const existingOrder = await prisma.offerLinkOrder.findUnique({
    where: { id: orderId },
    include: {
      devotees: true,
      offerLink: true
    }
  })

  if (!existingOrder) {
    throw new Error(`OfferLinkOrder with ID ${orderId} not found.`)
  }

  // 2. Update Order to SUCCESS & Reconciled
  const updateData: Record<string, any> = {
    paymentStatus: 'SUCCESS',
    reconciledStatus,
    reconciledAt: new Date()
  }

  if (paymentId) {
    updateData.paymentId = paymentId
  }
  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod
  }
  if (paymentDetails) {
    updateData.paymentDetails = paymentDetails
  }
  if (notes) {
    updateData.reconciliationNotes = notes
  }

  const updatedOrder = await prisma.offerLinkOrder.update({
    where: { id: orderId },
    data: updateData,
    include: {
      devotees: true,
      offerLink: true
    }
  })

  const primaryDevotee = updatedOrder.devotees.find(d => d.isPrimary) || updatedOrder.devotees[0]
  const customerName = primaryDevotee?.name || 'Devotee'
  const customerEmail = primaryDevotee?.email || null
  const customerPhone = primaryDevotee?.phone || null

  // 3. GST Invoice Generation (Isolated try-catch)
  let invoice: any = null
  try {
    invoice = await createInvoiceForOrder({
      orderType: 'OFFER',
      orderId: updatedOrder.id,
      userId: 'guest',
      customerName,
      customerEmail,
      itemLabel: `Offer booking: ${updatedOrder.offerLink.title}`,
      amountCharged: Number(updatedOrder.amount),
      gstPercentage: Number(updatedOrder.offerLink.gstRate),
      gstInclusive: updatedOrder.offerLink.gstIncluded
    })
  } catch (invErr) {
    console.error(`[OfferBooking] Invoice generation failed for order ${orderId}:`, invErr)
  }

  // 4. Devotee Email Receipt (Isolated try-catch)
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const { subject, html } = paymentSuccessEmail({
        customerName,
        itemLabel: `Offer booking: ${updatedOrder.offerLink.title}`,
        amount: Number(updatedOrder.amount),
        orderId: updatedOrder.id,
        invoiceNumber: invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${updatedOrder.id.slice(0, 8)}`
      })
      await sendEmail({ to: customerEmail, subject, html })
    } catch (mailErr) {
      console.error(`[OfferBooking] Devotee email failed for order ${orderId}:`, mailErr)
    }
  }

  // 5. Devotee DLT SMS Order Confirmation (Isolated try-catch)
  if (customerPhone && customerPhone.trim()) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mandirsetuu.com'
      const cleanAlphanumeric = updatedOrder.id.replace(/[^a-zA-Z0-9]/g, '')
      const shortOrderId = (cleanAlphanumeric.length > 8 ? cleanAlphanumeric.slice(0, 8) : cleanAlphanumeric || 'ORDER').toUpperCase()
      const trackLink = `${appUrl}/t/?id=${shortOrderId}`
      const smsRes = await sendOrderConfirmationSms({
        mobile: customerPhone,
        orderId: updatedOrder.id,
        trackLink
      })
      console.log(`[OfferBooking] SMS dispatch for order ${orderId}:`, smsRes)
    } catch (smsErr) {
      console.error(`[OfferBooking] Devotee SMS failed for order ${orderId}:`, smsErr)
    }
  }

  // 6. Admin Notification Email (Isolated try-catch)
  try {
    const totalDevoteesCount = await prisma.offerLinkDevotee.count({
      where: { order: { offerLinkId: updatedOrder.offerLinkId, paymentStatus: 'SUCCESS' } }
    })
    const initialCounter = (updatedOrder.offerLink as any).initialCounter ?? 10000
    const displayCounter = initialCounter + totalDevoteesCount

    const adminEmailData = adminOfferBookingSuccessEmail({
      orderId: updatedOrder.id,
      campaignTitle: updatedOrder.offerLink.title,
      amount: Number(updatedOrder.amount),
      paymentId: updatedOrder.paymentId || paymentId || '—',
      paymentMethod: updatedOrder.paymentMethod || paymentMethod || 'Online',
      referralCode: updatedOrder.referralCode,
      displayCounter,
      devotees: updatedOrder.devotees as any[],
      createdAt: updatedOrder.createdAt
    })

    const dbNotificationSettings = await getSettingsForCategory('NOTIFICATION_EMAIL').catch(() => ({}) as Record<string, string>)
    const adminEmailSetting = dbNotificationSettings.ADMIN_EMAIL || process.env.ADMIN_EMAIL || ''
    const customAdminEmails = adminEmailSetting
      .split(/[,;\s]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))

    const defaultAdmins = ['mandirsetu@gmail.com', 'admin@mandirsetuu.com']
    const uniqueAdminRecipients = Array.from(new Set([...customAdminEmails, ...defaultAdmins]))

    for (const adminEmail of uniqueAdminRecipients) {
      await sendEmail({
        to: adminEmail,
        subject: adminEmailData.subject,
        html: adminEmailData.html,
        category: 'NOTIFICATION_EMAIL'
      }).catch(err => console.error(`[Admin Booking Email] Failed sending to ${adminEmail}:`, err))
    }
  } catch (adminMailErr) {
    console.error(`[OfferBooking] Admin notification failed for order ${orderId}:`, adminMailErr)
  }

  return updatedOrder
}
