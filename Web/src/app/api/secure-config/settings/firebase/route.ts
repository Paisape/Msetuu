import { NextResponse } from 'next/server'
import { handleApiError } from '@/libs/api-auth'
import { requireSecureConfigAccess } from '@/libs/secureConfigSession'
import { getRedactedSettings, saveSettings } from '@/libs/secureConfigSettings'

export async function GET() {
  try {
    await requireSecureConfigAccess()
    const settings = await getRedactedSettings('FIREBASE')
    return NextResponse.json(settings)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSecureConfigAccess()
    const body = await req.json()
    await saveSettings('FIREBASE', body, user.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
