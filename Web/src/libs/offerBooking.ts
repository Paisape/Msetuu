/**
 * Core Offer Link Booking Confirmation & Multi-Channel Notification Engine
 * Centralized service to handle order payment confirmation, GST invoice creation,
 * DLT SMS dispatch, and admin/devotee email notifications.
 */

import prisma from '@/libs/prisma'
import { createInvoiceForOrder } from '@/libs/invoice'
import { devoteeOfferBookingInvoiceEmail, adminOfferBookingSuccessEmail } from '@/libs/emailTemplates'
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

export async function confirmOfferBookingAndNotify(
  input: ConfirmOfferBookingOptions | string,
  legacyPaymentId?: string,
  legacyPaymentMethod?: string
) {
  const opts: ConfirmOfferBookingOptions =
    typeof input === 'string'
      ? { orderId: input, paymentId: legacyPaymentId, paymentMethod: legacyPaymentMethod }
      : input

  const {
    orderId,
    paymentId,
    paymentMethod = 'Online (Razorpay)',
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
    throw new Error(`OfferLinkOrder ${orderId} not found`)
  }

  // 2. Mark order as SUCCESS and record payment details
  const updateData: Record<string, any> = {
    paymentStatus: 'SUCCESS',
    reconciledStatus,
    reconciledAt: new Date()
  }

  if (paymentId) updateData.paymentId = paymentId
  if (paymentMethod) updateData.paymentMethod = paymentMethod
  if (paymentDetails) updateData.paymentDetails = paymentDetails
  if (notes) updateData.reconciliationNotes = notes

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
  const customerEmail = primaryDevotee?.email || updatedOrder.devotees.find(d => d.email && d.email.includes('@'))?.email || null
  const customerPhone = primaryDevotee?.phone || updatedOrder.devotees.find(d => d.phone && d.phone.trim())?.phone || null

  // 3. Invoice Generation (No GST mentioned for special devotional offerings)
  let invoice: any = null
  try {
    invoice = await createInvoiceForOrder({
      orderType: 'OFFER',
      orderId: updatedOrder.id,
      userId: 'guest',
      customerName,
      customerEmail,
      itemLabel: `Offering Seva: ${updatedOrder.offerLink.title}`,
      amountCharged: Number(updatedOrder.amount),
      gstPercentage: 0,
      gstInclusive: true
    })
  } catch (invErr) {
    console.error(`[OfferBooking] Invoice generation failed for order ${orderId}:`, invErr)
  }

  // 4. Devotee Branded Receipt & Invoice Email (Isolated try-catch)
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const { subject, html } = devoteeOfferBookingInvoiceEmail({
        customerName,
        campaignTitle: updatedOrder.offerLink.title,
        amount: Number(updatedOrder.amount),
        orderId: updatedOrder.id,
        invoiceNumber: invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${updatedOrder.id.slice(0, 8).toUpperCase()}`,
        paymentMethod: updatedOrder.paymentMethod || paymentMethod || 'Online (Razorpay)',
        devotees: updatedOrder.devotees as any[],
        createdAt: updatedOrder.createdAt
      })
      await sendEmail({ to: customerEmail, subject, html })
    } catch (mailErr) {
      console.error(`[OfferBooking] Devotee email failed for order ${orderId}:`, mailErr)
    }
  }

  // 5. Devotee DLT SMS Order Confirmation (Isolated try-catch)
  if (customerPhone && customerPhone.trim()) {
    try {
      const cleanAlphanumeric = updatedOrder.id.replace(/[^a-zA-Z0-9]/g, '')
      const shortOrderId = (cleanAlphanumeric.length > 8 ? cleanAlphanumeric.slice(0, 8) : cleanAlphanumeric || 'ORDER').toUpperCase()
      const trackLink = `https://www.mandirsetuu.com/t/?id=${shortOrderId}`
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
