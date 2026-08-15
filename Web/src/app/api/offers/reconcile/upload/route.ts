import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

// POST /api/offers/reconcile/upload - Parse CSV settlement reports and reconcile orders
export async function POST(req: Request) {
  try {
    const admin = await requireUser()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const gateway = formData.get('gateway') as string || 'RAZORPAY' // RAZORPAY or PHONEPE

    if (!file) {
      return NextResponse.json({ error: 'No settlement file uploaded.' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)

    if (lines.length <= 1) {
      return NextResponse.json({ error: 'Uploaded file is empty or missing data lines.' }, { status: 400 })
    }

    // Parse header to find index columns
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
    
    // Find payment ID column index
    let idIndex = headers.findIndex(h => 
      h.includes('payment_id') || 
      h.includes('payment id') || 
      h.includes('transaction_id') || 
      h.includes('transaction id') || 
      h.includes('merchant transaction id') || 
      h.includes('reference id') ||
      h.includes('ref_no') ||
      h.includes('arn')
    )

    // Find amount column index
    let amountIndex = headers.findIndex(h => 
      h.includes('amount') || 
      h.includes('net') || 
      h.includes('settled') || 
      h.includes('value')
    )

    // Fallbacks if header matching fails
    if (idIndex === -1) idIndex = 0
    if (amountIndex === -1) amountIndex = 1

    let totalProcessed = 0
    let totalMatched = 0
    let totalDiscrepant = 0

    // Loop through rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(val => val.trim().replace(/^["']|["']$/g, ''))
      if (row.length <= idIndex || row.length <= amountIndex) continue

      const rawId = row[idIndex]
      const rawAmount = row[amountIndex]

      if (!rawId || !rawAmount) continue

      totalProcessed++

      // Clean ID and amount values
      const transactionId = rawId.trim()
      let parsedAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''))

      // Lookup order in database using paymentId/transactionId
      const order = await prisma.offerLinkOrder.findUnique({
        where: { paymentId: transactionId }
      })

      if (order) {
        const orderAmount = Number(order.amount)

        // Handle case where gateway CSV provides amount in Paise (cents) instead of Rupees/Dollars
        // E.g. if order is 51, and CSV is 5100, we divide by 100
        if (parsedAmount >= orderAmount * 90 && parsedAmount <= orderAmount * 110) {
          // Amounts align (within 10% tolerance to catch Paise scaling issues)
          if (parsedAmount === orderAmount * 100) {
            parsedAmount = parsedAmount / 100
          }
        }

        if (Math.abs(orderAmount - parsedAmount) < 0.05) {
          // Valid match: amount is correct
          await prisma.offerLinkOrder.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'SUCCESS',
              reconciledStatus: 'RECONCILED_AUTO',
              reconciledAt: new Date(),
              reconciliationNotes: `Settlement verified automatically from file: ${file.name}`
            }
          })
          totalMatched++
        } else {
          // Amount discrepancy found
          await prisma.offerLinkOrder.update({
            where: { id: order.id },
            data: {
              reconciledStatus: 'DISCREPANCY',
              reconciledAt: new Date(),
              reconciliationNotes: `Discrepancy: Database order has ${orderAmount} but settlement report shows ${parsedAmount}.`
            }
          })
          totalDiscrepant++
        }
      }
    }

    // Save run summary log
    const runLog = await prisma.reconciliationRun.create({
      data: {
        fileName: file.name,
        gatewayType: gateway,
        totalProcessed,
        totalMatched,
        totalDiscrepant,
        runByAdminId: admin.id
      }
    })

    return NextResponse.json({
      success: true,
      runId: runLog.id,
      fileName: file.name,
      totalProcessed,
      totalMatched,
      totalDiscrepant
    })
  } catch (err) {
    return handleApiError(err)
  }
}
