// Thin wrapper around freeastrologyapi.com (free tier — sign up at https://freeastrologyapi.com/signup
// for an `x-api-key`). Covers Panchang, Choghadiya and Muhurat data.
//
// Key is resolved DB-first (Config > Astrology, admin-editable, encrypted at rest) with .env as the
// fallback — see getSettingOrEnv. Same pattern as razorpay.ts/mailer.ts. If not configured, every
// function below throws AstrologyApiNotConfiguredError so callers can fall back to locally computed
// placeholder data instead of a 500.

import { getSettingOrEnv } from '@/libs/appSettings'

const BASE_URL = 'https://json.freeastrologyapi.com'

// Default reference location (New Delhi) used when the caller doesn't supply lat/lon/timezone —
// Panchang timings are location-dependent (sunrise/sunset shift), so pass real coordinates where possible.
export const DEFAULT_LOCATION = { latitude: 28.6139, longitude: 77.209, timezone: 5.5 }

export class AstrologyApiNotConfiguredError extends Error {
  constructor() {
    super('ASTROLOGY_API_KEY is not configured. Sign up for free at https://freeastrologyapi.com/signup')
  }
}

export type AstrologyDateInput = {
  date: Date
  latitude?: number
  longitude?: number
  timezone?: number
}

function buildRequestBody({ date, latitude, longitude, timezone }: AstrologyDateInput) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    date: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds(),
    latitude: latitude ?? DEFAULT_LOCATION.latitude,
    longitude: longitude ?? DEFAULT_LOCATION.longitude,
    timezone: timezone ?? DEFAULT_LOCATION.timezone,
    config: { observation_point: 'topocentric', ayanamsha: 'lahiri' }
  }
}

async function callAstrologyApi(endpoint: string, input: AstrologyDateInput) {
  const apiKey = await getSettingOrEnv('ASTROLOGY', 'ASTROLOGY_API_KEY', 'ASTROLOGY_API_KEY')

  if (!apiKey) throw new AstrologyApiNotConfiguredError()

  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(buildRequestBody(input)),

    // Panchang timings for a given day don't change — cache for a few hours to stay within free-tier limits
    next: { revalidate: 60 * 60 * 6 }
  })

  if (!res.ok) {
    throw new Error(`freeastrologyapi.com request to ${endpoint} failed with status ${res.status}`)
  }

  return res.json()
}

export const getChoghadiyaTimings = (input: AstrologyDateInput) => callAstrologyApi('choghadiya-timings', input)
export const getGoodBadTimes = (input: AstrologyDateInput) => callAstrologyApi('good-bad-times', input)
export const getTithi = (input: AstrologyDateInput) => callAstrologyApi('tithi-durations', input)
export const getNakshatra = (input: AstrologyDateInput) => callAstrologyApi('nakshatra-durations', input)
export const getYoga = (input: AstrologyDateInput) => callAstrologyApi('yoga-durations', input)
export const getKarana = (input: AstrologyDateInput) => callAstrologyApi('karana-durations', input)
export const getSunriseSunset = (input: AstrologyDateInput) => callAstrologyApi('getsunriseandset', input)

// -- Planet positions --------------------------------------------------------------------------
// Birth-chart planet positions (Rasi chart) and an extended variant that also includes
// Uranus/Neptune/Pluto — same provider/key as everything above, no separate signup needed.
export const getPlanets = (input: AstrologyDateInput) => callAstrologyApi('planets', input)
export const getPlanetsExtended = (input: AstrologyDateInput) => callAstrologyApi('planets/extended', input)

// -- Vimshottari Dasha --------------------------------------------------------------------------
export const getMahaDasas = (input: AstrologyDateInput) => callAstrologyApi('vimsottari/maha-dasas', input)
export const getMahaDasasAntarDasas = (input: AstrologyDateInput) =>
  callAstrologyApi('vimsottari/maha-dasas-and-antar-dasas', input)

// -- Match Making (Kundli matching / Ashtakoot score) ------------------------------------------
// Needs two birth details (bride & groom), not the single-date shape used everywhere else above,
// so it builds its own request body instead of going through callAstrologyApi/buildRequestBody.
export type MatchMakingInput = {
  boy: AstrologyDateInput
  girl: AstrologyDateInput
}

export async function getAshtakootScore({ boy, girl }: MatchMakingInput) {
  const apiKey = await getSettingOrEnv('ASTROLOGY', 'ASTROLOGY_API_KEY', 'ASTROLOGY_API_KEY')

  if (!apiKey) throw new AstrologyApiNotConfiguredError()

  const res = await fetch(`${BASE_URL}/ashtakoot-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      male: buildRequestBody(boy),
      female: buildRequestBody(girl)
    })
  })

  if (!res.ok) {
    throw new Error(`freeastrologyapi.com request to ashtakoot-score failed with status ${res.status}`)
  }

  return res.json()
}

// -- Geo Location + Timezone -------------------------------------------------------------------
// Covers the "Birth Place Lookup" / "Timezone" needs (GeoNames/TimeZoneDB equivalents) using the
// same already-configured key — one less API/signup for the admin to manage.
export async function getGeoLocation(place: string) {
  const apiKey = await getSettingOrEnv('ASTROLOGY', 'ASTROLOGY_API_KEY', 'ASTROLOGY_API_KEY')

  if (!apiKey) throw new AstrologyApiNotConfiguredError()

  const res = await fetch(`${BASE_URL}/geo-location/geo-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ place }),
    next: { revalidate: 60 * 60 * 24 * 30 } // place lookups don't change — cache for a month
  })

  if (!res.ok) {
    throw new Error(`freeastrologyapi.com request to geo-location failed with status ${res.status}`)
  }

  return res.json()
}

export async function getTimezoneWithDst(input: { latitude: number; longitude: number; date: Date }) {
  const apiKey = await getSettingOrEnv('ASTROLOGY', 'ASTROLOGY_API_KEY', 'ASTROLOGY_API_KEY')

  if (!apiKey) throw new AstrologyApiNotConfiguredError()

  const res = await fetch(`${BASE_URL}/time-zone-api-docs/time-zone-with-dst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      latitude: input.latitude,
      longitude: input.longitude,
      year: input.date.getUTCFullYear(),
      month: input.date.getUTCMonth() + 1,
      date: input.date.getUTCDate()
    })
  })

  if (!res.ok) {
    throw new Error(`freeastrologyapi.com request to time-zone failed with status ${res.status}`)
  }

  return res.json()
}
