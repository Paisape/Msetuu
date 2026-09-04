import prisma from '@/libs/prisma'
import type { OrderType } from '@/libs/orderTrail'

type CreateInvoiceInput = {
  orderType: OrderType
  orderId: string
  userId: string
  customerName: string
  customerEmail?: string | null
  itemLabel: string

  // The amount actually charged to the customer (post-discount). Whether this already
  // includes GST is decided by gstInclusive, matching the Product/Chadhava/Puja/Kundli
  // pricing model used across the storefront.
  amountCharged: number
  gstPercentage?: number | null
  gstInclusive?: boolean | null
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()

  // Find the latest invoice created this year to extract the highest sequence number
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    orderBy: { createdAt: 'desc' }
  })

  let nextSeq = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-')
    const lastNum = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1
    }
  }

  for (let i = 0; i < 20; i++) {
    const candidate = `INV-${year}-${String(nextSeq + i).padStart(5, '0')}`
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } })
    if (!existing) return candidate
  }

  // Fallback to timestamp + random suffix if sequence collides
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `INV-${year}-${Date.now().toString().slice(-6)}${rand}`
}

// Generates a GST invoice for an order whose payment has just succeeded. No-op-safe to call
// once per order — callers should only invoke this right after setting paymentStatus PAID.
export async function createInvoiceForOrder(input: CreateInvoiceInput) {
  // 1. Idempotency check — if an invoice already exists for this order, return it
  const existingInvoice = await prisma.invoice.findFirst({
    where: { orderType: input.orderType, orderId: input.orderId }
  })
  if (existingInvoice) return existingInvoice

  const gst = input.gstPercentage || 0
  const inclusive = input.gstInclusive !== false
  const amount = input.amountCharged

  let subtotal: number
  let gstAmount: number
  const total = amount

  if (gst > 0) {
    if (inclusive) {
      subtotal = Math.round((amount / (1 + gst / 100)) * 100) / 100
      gstAmount = Math.round((amount - subtotal) * 100) / 100
    } else {
      subtotal = amount
      gstAmount = Math.round(((amount * gst) / 100) * 100) / 100
    }
  } else {
    subtotal = amount
    gstAmount = 0
  }

  // Ensure a valid userId that exists in User table (avoids foreign key constraint failure for guest/offer orders)
  let validUserId = input.userId
  if (!validUserId || validUserId === 'guest') {
    if (input.customerEmail) {
      const u = await prisma.user.findFirst({ where: { email: input.customerEmail } })
      if (u) validUserId = u.id
    }
    if (!validUserId || validUserId === 'guest') {
      const fallbackUser = (await prisma.user.findFirst({ where: { role: 'ADMIN' } })) || (await prisma.user.findFirst())
      if (fallbackUser) {
        validUserId = fallbackUser.id
      }
    }
  }

  if (!validUserId) {
    validUserId = 'guest'
  }

  try {
    const invoiceNumber = await nextInvoiceNumber()
    return await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderType: input.orderType,
        orderId: input.orderId,
        userId: validUserId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        itemLabel: input.itemLabel,
        subtotal,
        gstPercentage: gst,
        gstAmount,
        total: inclusive ? total : subtotal + gstAmount,
        status: 'PAID'
      }
    })
  } catch (err: any) {
    // Unique constraint collision fallback
    if (err?.code === 'P2002' || String(err?.message || '').includes('invoiceNumber')) {
      const year = new Date().getFullYear()
      const fallbackInvoiceNumber = `INV-${year}-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`
      return await prisma.invoice.create({
        data: {
          invoiceNumber: fallbackInvoiceNumber,
          orderType: input.orderType,
          orderId: input.orderId,
          userId: validUserId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          itemLabel: input.itemLabel,
          subtotal,
          gstPercentage: gst,
          gstAmount,
          total: inclusive ? total : subtotal + gstAmount,
          status: 'PAID'
        }
      })
    }
    throw err
  }
}

// Called when an admin cancels an order that already has a PAID invoice — flips the invoice
// to CANCELLED and opens a Refund record for finance/ops to action manually (no payment
// gateway is integrated yet, so this is a tracked record, not an automatic money transfer).
export async function cancelInvoiceAndRefund(orderType: OrderType, orderId: string, reason?: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { orderType, orderId, status: 'PAID' }
  })

  if (!invoice) return null

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() }
  })

  const existingRefund = await prisma.refund.findUnique({ where: { invoiceId: invoice.id } })

  if (existingRefund) return existingRefund

  return prisma.refund.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.total,
      reason: reason || 'Order cancelled after payment',
      status: 'INITIATED'
    }
  })
}
