import { getSettingOrEnv } from '@/libs/appSettings'

// Thin wrapper around astrologyapi.com's Horoscope API (sign up at https://www.astrologyapi.com —
// 50 free credits, then pay-as-you-go). Provides natural-language daily/monthly Rashifal prediction
// text per zodiac sign — freeastrologyapi.com (used for Panchang/Choghadiya in astrology.ts) has no
// equivalent endpoint, hence the separate provider/credential pair.
//
// Credentials resolved DB-first (Config > Astrology, admin-editable) with .env fallback, same
// pattern as every other secret-consuming lib in this app. Throws (never returns fake data) when
// not configured or the upstream call fails.

const BASE_URL = 'https://json.astrologyapi.com/v1'

export class HoroscopeApiNotConfiguredError extends Error {
  constructor() {
    super('AstrologyAPI.com is not configured. Set it up under Config > Astrology, or ASTROLOGYAPI_USER_ID/ASTROLOGYAPI_API_KEY in your environment.')
  }
}

export const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
] as const

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number]

// 'tomorrow' uses AstrologyAPI.com's daily/:sign/next endpoint. There's no weekly endpoint on
// this provider — callers should keep static/placeholder text for a "this week" view.
export type HoroscopePeriod = 'daily' | 'tomorrow' | 'monthly'

async function resolveCredentials(): Promise<{ userId?: string; apiKey?: string }> {
  const [userId, apiKey] = await Promise.all([
    getSettingOrEnv('ASTROLOGY', 'ASTROLOGYAPI_USER_ID', 'ASTROLOGYAPI_USER_ID'),
    getSettingOrEnv('ASTROLOGY', 'ASTROLOGYAPI_API_KEY', 'ASTROLOGYAPI_API_KEY')
  ])

  return { userId, apiKey }
}

export async function isHoroscopeApiConfigured(): Promise<boolean> {
  const { userId, apiKey } = await resolveCredentials()

  return Boolean(userId && apiKey)
}

export async function getHoroscope(sign: ZodiacSign, period: HoroscopePeriod = 'daily'): Promise<{ prediction: string }> {
  const { userId, apiKey } = await resolveCredentials()

  if (!userId || !apiKey) throw new HoroscopeApiNotConfiguredError()

  const endpoint =
    period === 'monthly'
      ? `horoscope_prediction/monthly/${sign}`
      : period === 'tomorrow'
        ? `sun_sign_prediction/daily/${sign}/next`
        : `sun_sign_prediction/daily/${sign}`

  const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64')

  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}`, 'Accept-Language': 'en' },

    // Daily/monthly horoscope text doesn't change intra-day — cache a few hours to conserve credits.
    next: { revalidate: 60 * 60 * 6 }
  })

  if (!res.ok) {
    throw new Error(`astrologyapi.com request to ${endpoint} failed with status ${res.status}`)
  }

  const data = await res.json()
  const prediction = data?.prediction || data?.horoscope_data || data?.bot_response

  if (!prediction || typeof prediction !== 'string') {
    throw new Error('astrologyapi.com returned an unexpected response shape.')
  }

  return { prediction }
}
