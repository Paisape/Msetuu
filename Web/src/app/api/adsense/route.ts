import { NextResponse } from 'next/server'
import { getResolvedSettings } from '@/libs/secureConfigSettings'

export async function GET() {
  try {
    const settings = await getResolvedSettings('ADSENSE')

    const clientId = settings.ADSENSE_CLIENT_ID || process.env.ADSENSE_CLIENT_ID || ''
    const autoAdsEnabled = (settings.ADSENSE_AUTO_ADS_ENABLED || process.env.ADSENSE_AUTO_ADS_ENABLED || 'true').toLowerCase() === 'true'
    const headerSlotId = settings.ADSENSE_HEADER_SLOT_ID || process.env.ADSENSE_HEADER_SLOT_ID || ''
    const bottomSlotId = settings.ADSENSE_BOTTOM_SLOT_ID || process.env.ADSENSE_BOTTOM_SLOT_ID || ''
    const sidebarSlotId = settings.ADSENSE_SIDEBAR_SLOT_ID || process.env.ADSENSE_SIDEBAR_SLOT_ID || ''

    return NextResponse.json({
      clientId,
      autoAdsEnabled,
      headerSlotId,
      bottomSlotId,
      sidebarSlotId
    })
  } catch (err: any) {
    return NextResponse.json({
      clientId: process.env.ADSENSE_CLIENT_ID || '',
      autoAdsEnabled: true,
      headerSlotId: '',
      bottomSlotId: '',
      sidebarSlotId: ''
    })
  }
}
