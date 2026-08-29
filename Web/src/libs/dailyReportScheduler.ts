import { sendDailySummaryEmail } from './dailyReportEmail'

declare global {
  // eslint-disable-next-line no-var
  var __mandirsetu_daily_cron_initialized__: boolean | undefined
}

/**
 * Calculates milliseconds until the next 12:00 AM Midnight in Indian Standard Time (IST, UTC+5:30).
 */
export function getMsUntilNextMidnightIst(): number {
  const now = new Date()
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffsetMs)

  // Current day in IST
  const istYear = istNow.getUTCFullYear()
  const istMonth = istNow.getUTCMonth()
  const istDate = istNow.getUTCDate()

  // Next Midnight in IST (Tomorrow at 00:00:00.000 IST)
  const nextMidnightIstUtcMs = Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0, 0) - istOffsetMs

  const msRemaining = nextMidnightIstUtcMs - now.getTime()
  return msRemaining > 0 ? msRemaining : 1000
}

/**
 * Initializes the autonomous 12:00 AM IST daily email cron loop in the Node.js runtime.
 */
export function initDailyReportCron() {
  if (typeof window !== 'undefined') return // Run only on server
  if (global.__mandirsetu_daily_cron_initialized__) {
    return
  }

  global.__mandirsetu_daily_cron_initialized__ = true

  const scheduleNextRun = () => {
    const msUntilMidnight = getMsUntilNextMidnightIst()
    const hours = (msUntilMidnight / (1000 * 60 * 60)).toFixed(2)
    console.log(`[Daily Report Cron] Scheduled next 12:00 AM IST summary email in ${hours} hours.`)

    setTimeout(async () => {
      try {
        console.log('[Daily Report Cron] 12:00 AM IST Midnight reached. Generating and sending daily summary report...')
        // Report for the day just completed
        const yesterday = new Date(Date.now() - 60 * 1000)
        const result = await sendDailySummaryEmail(yesterday)
        console.log('[Daily Report Cron] Successfully sent daily report:', result.results)
      } catch (err) {
        console.error('[Daily Report Cron] Failed to send scheduled daily report:', err)
      } finally {
        // Schedule next midnight run
        scheduleNextRun()
      }
    }, msUntilMidnight)
  }

  scheduleNextRun()
}
