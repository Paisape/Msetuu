import { apiGet, apiPost } from './client'
import type { YatraBooking } from './types'

export function getMyYatraBookings() {
  return apiGet<YatraBooking[]>('/yatra')
}

export function createYatraBooking(input: {
  name: string
  contactNumber: string
  cityOfDeparture: string
  destination: string
  totalTravelers?: number
  travelDate: string
  comment?: string
}) {
  // Note: the request field is `destination`, but the backend stores/returns it as
  // `yatraDestination` — see docs/MOBILE_API_MAPPING.md.
  return apiPost<YatraBooking>('/yatra', input)
}
