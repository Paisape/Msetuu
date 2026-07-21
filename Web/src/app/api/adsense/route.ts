import { NextResponse } from 'next/server'
import { getResolvedSettings } from '@/libs/secureConfigSettings'

export async function GET() {
  try {
    const settings = await getResolvedSettings('ADSENSE')

    const clientId = settings.ADSENSE_CLIENT_ID || process.env.ADSENSE_CLIENT_ID || ''
    const autoAdsEnabled = (settings.ADSENSE_AUTO_ADS_ENABLED || process.env.ADSENSE_AUTO_ADS_ENABLED || 'true').toLowerCase() === 'true'
    const prerollEnabled = (settings.ADSENSE_PREROLL_ENABLED || process.env.ADSENSE_PREROLL_ENABLED || 'true').toLowerCase() === 'true'
    const prerollSeconds = parseInt(settings.ADSENSE_PREROLL_SECONDS || process.env.ADSENSE_PREROLL_SECONDS || '5', 10) || 5
    const overlayAdsEnabled = (settings.ADSENSE_OVERLAY_ADS_ENABLED || process.env.ADSENSE_OVERLAY_ADS_ENABLED || 'true').toLowerCase() === 'true'
    const prerollSlotId = settings.ADSENSE_PREROLL_SLOT_ID || process.env.ADSENSE_PREROLL_SLOT_ID || ''

    const headerSlotId = settings.ADSENSE_HEADER_SLOT_ID || process.env.ADSENSE_HEADER_SLOT_ID || ''
    const bottomSlotId = settings.ADSENSE_BOTTOM_SLOT_ID || process.env.ADSENSE_BOTTOM_SLOT_ID || ''
    const sidebarSlotId = settings.ADSENSE_SIDEBAR_SLOT_ID || process.env.ADSENSE_SIDEBAR_SLOT_ID || ''

    return NextResponse.json({
      clientId,
      autoAdsEnabled,
      prerollEnabled,
      prerollSeconds,
      overlayAdsEnabled,
      prerollSlotId,
      headerSlotId,
      bottomSlotId,
      sidebarSlotId
    })
  } catch (err: any) {
    return NextResponse.json({
      clientId: process.env.ADSENSE_CLIENT_ID || '',
      autoAdsEnabled: true,
      prerollEnabled: true,
      prerollSeconds: 5,
      overlayAdsEnabled: true,
      prerollSlotId: '',
      headerSlotId: '',
      bottomSlotId: '',
      sidebarSlotId: ''
    })
  }
}
