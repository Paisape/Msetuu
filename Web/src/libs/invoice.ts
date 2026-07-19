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
  const count = await prisma.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${year}-` } } })

  return `INV-${year}-${String(count + 1).padStart(5, '0')}`
}

// Generates a GST invoice for an order whose payment has just succeeded. No-op-safe to call
// once per order — callers should only invoke this right after setting paymentStatus PAID.
export async function createInvoiceForOrder(input: CreateInvoiceInput) {
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

  const invoiceNumber = await nextInvoiceNumber()

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderType: input.orderType,
      orderId: input.orderId,
      userId: input.userId,
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
