import { NextResponse } from 'next/server'
import { sendDailySummaryEmail, generateDailySummaryData } from '@/libs/dailyReportEmail'

// GET /api/cron/daily-report — triggers the automated daily business summary email
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const preview = searchParams.get('preview') === 'true'
    const recipientsParam = searchParams.get('recipients')
    const recipientOverride = recipientsParam ? recipientsParam.split(',').map(e => e.trim()).filter(Boolean) : undefined

    if (preview) {
      const summary = await generateDailySummaryData()
      return NextResponse.json({ success: true, preview: true, summary })
    }

    const reportResult = await sendDailySummaryEmail(undefined, recipientOverride)
    return NextResponse.json({
      success: true,
      message: 'Daily business report generated and dispatched successfully via Main SMTP.',
      ...reportResult
    })
  } catch (error: any) {
    console.error('[CRON Daily Report Error]:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to generate or send daily report.'
    }, { status: 500 })
  }
}

// POST /api/cron/daily-report — manual or scheduled trigger
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const recipientOverride = body.recipients && Array.isArray(body.recipients) ? body.recipients : undefined

    const reportResult = await sendDailySummaryEmail(undefined, recipientOverride)
    return NextResponse.json({
      success: true,
      message: 'Daily business report generated and dispatched successfully via Main SMTP.',
      ...reportResult
    })
  } catch (error: any) {
    console.error('[CRON Daily Report Error]:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to generate or send daily report.'
    }, { status: 500 })
  }
}
