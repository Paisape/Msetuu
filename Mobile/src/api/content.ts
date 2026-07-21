import { apiGet, apiPost } from './client'
import type { Banner, Category, DarshanTemple, Faq, Mantra } from './types'

export function getBanners(page: string) {
  return apiGet<Banner[]>(`/banners?page=${encodeURIComponent(page)}`)
}

export function getCategories(module: 'epuja' | 'ecommerce') {
  return apiGet<Category[]>(`/categories?module=${module}`)
}

export function getFaqs(page: string) {
  return apiGet<Faq[]>(`/faqs?page=${encodeURIComponent(page)}`)
}

export function getMantras() {
  return apiGet<Mantra[]>('/mantra')
}

export function getDarshanTemples() {
  return apiGet<DarshanTemple[]>('/darshan')
}

export function getDarshanTemple(id: string) {
  return apiGet<DarshanTemple>(`/darshan/${id}`)
}

/** Backs both the "write us your query" FAQ form and the Join Waitlist form — the
 * backend has no dedicated waitlist model yet, so waitlist submissions are routed
 * here too (see docs/MOBILE_API_MAPPING.md, "Join Waitlist" row). */
export function submitContact(name: string, email: string, message: string) {
  return apiPost<{ success: true }>('/contact', { name, email, message })
}
