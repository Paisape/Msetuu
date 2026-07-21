import { apiGet, apiPost } from './client'
import type { ChadhavaListing, ChadhavaOrder, KundliListing, KundliOrder, PersonDetail, PujaListing, PujaOrder, RazorpayOrder } from './types'

// ---- E-Puja ----

export function getPujaListings(category?: string) {
  return apiGet<PujaListing[]>(`/epuja/listings${category ? `?category=${encodeURIComponent(category)}` : ''}`)
}

export function getPujaListing(id: string) {
  return apiGet<PujaListing>(`/epuja/listings/${id}`)
}

export function getMyPujaOrders() {
  return apiGet<PujaOrder[]>('/epuja')
}

export function createPujaOrder(input: {
  name: string
  gender: string
  dob: string
  birthPlace: string
  comment?: string
  pujaListingId: string
  pujaPackageId: string
  devotees?: PersonDetail[]
}) {
  return apiPost<{ order: PujaOrder; razorpayOrder: RazorpayOrder }>('/epuja', input)
}

// ---- Chadhava ----

export function getChadhavaListings() {
  return apiGet<ChadhavaListing[]>('/chadhava/listings')
}

export function getChadhavaListing(id: string) {
  return apiGet<ChadhavaListing>(`/chadhava/listings/${id}`)
}

export function getMyChadhavaOrders() {
  return apiGet<ChadhavaOrder[]>('/chadhava')
}

export function getChadhavaOrder(id: string) {
  return apiGet<ChadhavaOrder>(`/chadhava/${id}`)
}

export function createChadhavaOrder(input: {
  name: string
  gender: string
  dob: string
  birthPlace: string
  comment?: string
  chadhavaListingId: string
  persons: PersonDetail[]
}) {
  return apiPost<{ order: ChadhavaOrder; razorpayOrder: RazorpayOrder }>('/chadhava', input)
}

// ---- Kundli ----

export function getKundliListings() {
  return apiGet<KundliListing[]>('/kundli/listings')
}

export function getMyKundliOrders() {
  return apiGet<KundliOrder[]>('/kundli')
}

export function getKundliOrder(id: string) {
  return apiGet<KundliOrder>(`/kundli/${id}`)
}

export function createKundliOrder(input: {
  name: string
  gender: string
  dob: string
  timeOfBirth?: string
  birthPlace: string
  comment?: string
  kundliListingId: string
}) {
  return apiPost<{ order: KundliOrder; razorpayOrder: RazorpayOrder }>('/kundli', input)
}
