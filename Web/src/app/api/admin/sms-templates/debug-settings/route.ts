import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/admin/sms-templates/debug-settings — debug database rows for SMS settings
export async function GET() {
  try {
    await requireAdmin()

    const rows = await prisma.appSetting.findMany({
      where: { category: 'SMS' }
    })

    const debugInfo = rows.map((r: { key: string; value: string }) => ({
      key: r.key,
      valueLength: r.value?.length || 0,
      hasEncryptedFormat: r.value?.includes(':'),
      rawContentSnippet: r.value ? r.value.slice(0, 15) + '...' : null
    }))

    return NextResponse.json({
      success: true,
      settingsCount: rows.length,
      settings: debugInfo
    })
  } catch (err) {
    return handleApiError(err)
  }
}
