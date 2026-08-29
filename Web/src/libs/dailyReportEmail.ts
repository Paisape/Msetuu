import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'

export type DailyReportItem = {
  sNo: number
  productName: string
  module: string
  totalBookings: number
  todayBookings: number
  totalAmount: number
  todayAmount: number
  totalDevotees: number
}

export type DailyReportSummary = {
  dateStr: string
  items: DailyReportItem[]
  grandTotals: {
    totalBookings: number
    todayBookings: number
    totalAmount: number
    todayAmount: number
    totalDevotees: number
  }
}

/**
 * Returns the UTC Date objects corresponding to Start and End of the IST (UTC+5:30) day.
 */
export function getIstDayBounds(targetDate?: Date) {
  const now = targetDate || new Date()
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffsetMs)

  const istYear = istNow.getUTCFullYear()
  const istMonth = istNow.getUTCMonth()
  const istDate = istNow.getUTCDate()

  const startOfIstDayUtcMs = Date.UTC(istYear, istMonth, istDate, 0, 0, 0, 0) - istOffsetMs
  const endOfIstDayUtcMs = Date.UTC(istYear, istMonth, istDate, 23, 59, 59, 999) - istOffsetMs

  const dateStr = `${String(istDate).padStart(2, '0')}/${String(istMonth + 1).padStart(2, '0')}/${istYear}`

  return {
    startOfDay: new Date(startOfIstDayUtcMs),
    endOfDay: new Date(endOfIstDayUtcMs),
    dateStr
  }
}

/**
 * Collects and aggregates all successful booking metrics across all platform modules.
 */
export async function generateDailySummaryData(referenceDate?: Date): Promise<DailyReportSummary> {
  const { startOfDay, endOfDay, dateStr } = getIstDayBounds(referenceDate)

  // Map to hold aggregated data by product/campaign title
  const productMap: Map<string, {
    productName: string
    module: string
    totalBookings: number
    todayBookings: number
    totalAmount: number
    todayAmount: number
    totalDevotees: number
  }> = new Map()

  const addEntry = (
    name: string,
    module: string,
    amount: number,
    devoteesCount: number,
    createdAt: Date
  ) => {
    const key = name.trim() || 'General Offering'
    const isToday = createdAt >= startOfDay && createdAt <= endOfDay

    const existing = productMap.get(key) || {
      productName: key,
      module,
      totalBookings: 0,
      todayBookings: 0,
      totalAmount: 0,
      todayAmount: 0,
      totalDevotees: 0
    }

    existing.totalBookings += 1
    existing.totalAmount += amount
    existing.totalDevotees += devoteesCount

    if (isToday) {
      existing.todayBookings += 1
      existing.todayAmount += amount
    }

    productMap.set(key, existing)
  }

  // 1. Offer Link Orders (Campaigns)
  try {
    const offerOrders = await prisma.offerLinkOrder.findMany({
      where: { paymentStatus: 'SUCCESS' },
      include: {
        offerLink: { select: { title: true } },
        devotees: { select: { id: true } }
      }
    })

    for (const ord of offerOrders) {
      const title = ord.offerLink?.title || 'Special Campaign'
      const amt = Number(ord.amount || 0)
      const devCount = ord.devotees?.length || 1
      addEntry(title, 'Campaign', amt, devCount, ord.createdAt)
    }
  } catch (err) {
    console.error('[Daily Report] Error querying offerLinkOrders:', err)
  }

  // 2. Puja Orders (E-Pujas)
  try {
    const pujaOrders = await prisma.pujaOrder.findMany({
      where: {
        paymentStatus: { in: ['SUCCESS', 'PAID'] }
      },
      include: {
        pujaListing: { select: { title: true } }
      }
    })

    for (const ord of pujaOrders) {
      const title = ord.pujaListing?.title ? `E-Puja: ${ord.pujaListing.title}` : 'E-Puja Booking'
      const amt = Number(ord.amountPaid || 0)
      let devCount = 1
      if (Array.isArray(ord.devotees)) {
        devCount = ord.devotees.length + 1
      }
      addEntry(title, 'E-Puja', amt, devCount, ord.createdAt)
    }
  } catch (err) {
    console.error('[Daily Report] Error querying pujaOrders:', err)
  }

  // 3. Chadhava Orders
  try {
    const chadhavaOrders = await prisma.chadhavaOrder.findMany({
      where: {
        paymentStatus: { in: ['SUCCESS', 'PAID'] }
      },
      include: {
        chadhavaListing: { select: { title: true } }
      }
    })

    for (const ord of chadhavaOrders) {
      const title = ord.chadhavaListing?.title ? `Chadhava: ${ord.chadhavaListing.title}` : 'Chadhava Offering'
      const amt = Number(ord.amountPaid || 0)
      const devCount = ord.personCount || 1
      addEntry(title, 'Chadhava', amt, devCount, ord.createdAt)
    }
  } catch (err) {
    console.error('[Daily Report] Error querying chadhavaOrders:', err)
  }

  // 4. Product Orders (Ecommerce)
  try {
    const productOrders = await prisma.productOrder.findMany({
      where: {
        paymentStatus: { in: ['SUCCESS', 'PAID'] }
      },
      include: {
        product: { select: { title: true } }
      }
    })

    for (const ord of productOrders) {
      const title = ord.product?.title || 'Divine Product'
      const amt = Number(ord.totalAmount || 0)
      const qty = ord.quantity || 1
      addEntry(title, 'Ecommerce', amt, qty, ord.createdAt)
    }
  } catch (err) {
    console.error('[Daily Report] Error querying productOrders:', err)
  }

  // 5. Kundli Orders
  try {
    const kundliOrders = await prisma.kundliOrder.findMany({
      where: {
        paymentStatus: { in: ['SUCCESS', 'PAID'] }
      }
    })

    for (const ord of kundliOrders) {
      const title = ord.kundliType || 'Janam Kundli'
      const amt = Number(ord.amountPaid || 0)
      addEntry(`Kundli: ${title}`, 'Kundli', amt, 1, ord.createdAt)
    }
  } catch (err) {
    console.error('[Daily Report] Error querying kundliOrders:', err)
  }

  // 6. Jyotish Consultation Bookings
  try {
    const jyotishBookings = await prisma.consultationBooking.findMany({
      where: {
        paymentStatus: { in: ['SUCCESS', 'PAID'] }
      }
    })

    for (const ord of jyotishBookings) {
      const title = ord.category || 'Vedic Astrology Consultation'
      const amt = Number(ord.amountPaid || 0)
      addEntry(`Jyotish: ${title}`, 'Jyotish', amt, 1, ord.createdAt)
    }
  } catch (err) {
    console.error('[Daily Report] Error querying consultationBookings:', err)
  }

  // Sort by Today's amount descending, then total amount descending
  const sortedItems = Array.from(productMap.values()).sort((a, b) => {
    if (b.todayAmount !== a.todayAmount) return b.todayAmount - a.todayAmount
    return b.totalAmount - a.totalAmount
  })

  const items: DailyReportItem[] = sortedItems.map((item, index) => ({
    sNo: index + 1,
    ...item
  }))

  const grandTotals = items.reduce(
    (acc, curr) => ({
      totalBookings: acc.totalBookings + curr.totalBookings,
      todayBookings: acc.todayBookings + curr.todayBookings,
      totalAmount: acc.totalAmount + curr.totalAmount,
      todayAmount: acc.todayAmount + curr.todayAmount,
      totalDevotees: acc.totalDevotees + curr.totalDevotees
    }),
    { totalBookings: 0, todayBookings: 0, totalAmount: 0, todayAmount: 0, totalDevotees: 0 }
  )

  return {
    dateStr,
    items,
    grandTotals
  }
}

/**
 * Builds the responsive HTML email template matching the user's exact specification.
 */
export function buildDailyReportEmailHtml(summary: DailyReportSummary): string {
  const { dateStr, items, grandTotals } = summary

  const tableRows = items.length === 0
    ? `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8; font-size: 13px;">No successful bookings recorded yet.</td></tr>`
    : items.map(item => `
      <tr style="border-bottom: 1px solid #f1f5f9; ${item.todayBookings > 0 ? 'background-color: #fffbeb;' : ''}">
        <td style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #64748b;">${item.sNo}</td>
        <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; color: #1e293b;">
          ${item.productName}
          <span style="display: block; font-size: 10px; font-weight: 500; color: #94a3b8; text-transform: uppercase;">${item.module}</span>
        </td>
        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 700; color: #334155;">
          ${item.totalBookings}
        </td>
        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 800; color: ${item.todayBookings > 0 ? '#ea580c' : '#94a3b8'};">
          ${item.todayBookings > 0 ? `+${item.todayBookings}` : '0'}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a; font-family: 'Courier New', Courier, monospace;">
          ₹${item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: 800; color: ${item.todayAmount > 0 ? '#16a34a' : '#94a3b8'}; font-family: 'Courier New', Courier, monospace;">
          ${item.todayAmount > 0 ? `+₹${item.todayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
        </td>
        <td style="padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 700; color: #0284c7;">
          ${item.totalDevotees}
        </td>
      </tr>
    `).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mandirsetuu Daily Business Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 900px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #FF671F 0%, #d9530f 100%); padding: 24px 32px; color: #ffffff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Mandirsetuu Daily Business Report</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.95; color: #fff7ed;">
              Midnight Summary for <strong>${dateStr} (12:00 AM IST)</strong> &bull; Only Successful Payments
            </p>
          </td>
          <td style="text-align: right;">
            <span style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff;">
              ✓ Automated Daily Cron
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Summary Key Metrics Cards -->
    <div style="padding: 24px 32px 12px 32px; background-color: #fafaf9; border-bottom: 1px solid #f0eee9;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 25%; padding: 6px;">
            <div style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #e7e5e4; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; display: block;">Today's Revenue</span>
              <span style="font-size: 18px; font-weight: 800; color: #16a34a; font-family: 'Courier New', Courier, monospace; display: block; margin-top: 4px;">
                ₹${grandTotals.todayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </td>
          <td style="width: 25%; padding: 6px;">
            <div style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #e7e5e4; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; display: block;">Today's Bookings</span>
              <span style="font-size: 18px; font-weight: 800; color: #ea580c; display: block; margin-top: 4px;">
                ${grandTotals.todayBookings}
              </span>
            </div>
          </td>
          <td style="width: 25%; padding: 6px;">
            <div style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #e7e5e4; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; display: block;">All-Time Revenue</span>
              <span style="font-size: 18px; font-weight: 800; color: #0f172a; font-family: 'Courier New', Courier, monospace; display: block; margin-top: 4px;">
                ₹${grandTotals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </td>
          <td style="width: 25%; padding: 6px;">
            <div style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #e7e5e4; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; display: block;">Total Devotees</span>
              <span style="font-size: 18px; font-weight: 800; color: #0284c7; display: block; margin-top: 4px;">
                ${grandTotals.totalDevotees}
              </span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Table -->
    <div style="padding: 24px 32px;">
      <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0;">
        📊 Campaign & Product Performance Breakdown
      </h3>

      <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: center; width: 45px;">S.No</th>
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Product / Campaign</th>
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: center;">Total Booking (incl. today)</th>
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; text-align: center; background-color: #fff7ed;">Today Booking</th>
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: right;">Total Amount</th>
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; text-align: right; background-color: #f0fdf4;">Today Amount</th>
              <th style="padding: 12px; font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; text-align: center;">Total Devotees</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; border-top: 2px solid #94a3b8; font-weight: 800;">
              <td colspan="2" style="padding: 14px 12px; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                ⭐ GRAND TOTAL
              </td>
              <td style="padding: 14px 12px; text-align: center; font-size: 14px; font-weight: 800; color: #0f172a;">
                ${grandTotals.totalBookings}
              </td>
              <td style="padding: 14px 12px; text-align: center; font-size: 14px; font-weight: 800; color: #ea580c; background-color: #fff7ed;">
                ${grandTotals.todayBookings}
              </td>
              <td style="padding: 14px 12px; text-align: right; font-size: 14px; font-weight: 800; color: #0f172a; font-family: 'Courier New', Courier, monospace;">
                ₹${grandTotals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="padding: 14px 12px; text-align: right; font-size: 14px; font-weight: 800; color: #16a34a; font-family: 'Courier New', Courier, monospace; background-color: #f0fdf4;">
                ₹${grandTotals.todayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="padding: 14px 12px; text-align: center; font-size: 14px; font-weight: 800; color: #0284c7;">
                ${grandTotals.totalDevotees}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 11px; color: #64748b;">
      <p style="margin: 0;">
        Mandirsetuu Enterprise Portal &bull; Generated automatically at 12:00 AM IST via Main SMTP
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()
}

/**
 * Generates and dispatches the daily summary email to the designated admin addresses via Main SMTP.
 */
export async function sendDailySummaryEmail(referenceDate?: Date, recipientOverride?: string[]) {
  const summary = await generateDailySummaryData(referenceDate)
  const html = buildDailyReportEmailHtml(summary)
  const subject = `Mandirsetuu Daily Business Report - ${summary.dateStr} (12:00 AM IST)`

  const defaultRecipients = ['amit@mandirsetuu.com', 'bmrjjn@gmail.com']
  const recipients = recipientOverride && recipientOverride.length > 0 ? recipientOverride : defaultRecipients

  const results = []
  for (const email of recipients) {
    const cleanEmail = email.trim()
    if (!cleanEmail.includes('@')) continue

    const res = await sendEmail({
      to: cleanEmail,
      subject,
      html,
      category: 'EMAIL' // Sent via Main SMTP configured as requested
    })
    results.push({ email: cleanEmail, ...res })
  }

  return {
    summary,
    results
  }
}
