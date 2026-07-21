import { apiGet, apiPost } from './client'
import type { Astrologer, ConsultationBooking, RazorpayOrder } from './types'

export function getAstrologers() {
  return apiGet<Astrologer[]>('/jyotish/astrologers')
}

export function getAstrologer(id: string) {
  return apiGet<Astrologer>(`/jyotish/astrologers/${id}`)
}

export function getMyConsultations() {
  return apiGet<ConsultationBooking[]>('/jyotish')
}

export function createConsultationBooking(input: {
  category: string
  slotTime: string
  name: string
  email: string
  phone: string
  dob: string
  timeOfBirth: string
  placeOfBirth: string
  duration: 30 | 60
  comment: string
  astrologerId?: string
}) {
  return apiPost<{ booking: ConsultationBooking; razorpayOrder: RazorpayOrder }>('/jyotish', input)
}
