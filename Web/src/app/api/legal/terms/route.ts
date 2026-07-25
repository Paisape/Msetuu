import { NextResponse } from 'next/server'
import { getSettingOrEnv } from '@/libs/appSettings'

export async function GET() {
  try {
    const termsAndConditions = await getSettingOrEnv('LEGAL', 'TERMS_AND_CONDITIONS', 'TERMS_AND_CONDITIONS')

    return NextResponse.json({
      text: termsAndConditions || ''
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load terms and conditions' }, { status: 500 })
  }
}
