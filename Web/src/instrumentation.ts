export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initDailyReportCron } = await import('@/libs/dailyReportScheduler')
    initDailyReportCron()
  }
}
