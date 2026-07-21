import { API_BASE_URL, apiGet, apiPost, getToken } from './client'
import type { GeoTagPhoto, MyOrder, PaymentOrderType, Product } from './types'

export function getMyOrders() {
  return apiGet<MyOrder[]>('/my-orders')
}

export function verifyPayment(input: {
  orderType: PaymentOrderType
  orderId: string
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
}) {
  return apiPost<{ success: true; orderId: string }>('/payment/verify', input)
}

export function getProducts(params: { category?: string; purpose?: string; planet?: string; bestseller?: boolean } = {}) {
  const query = new URLSearchParams()

  if (params.category) query.set('category', params.category)
  if (params.purpose) query.set('purpose', params.purpose)
  if (params.planet) query.set('planet', params.planet)
  if (params.bestseller) query.set('bestseller', '1')

  const qs = query.toString()

  return apiGet<Product[]>(`/ecommerce/products${qs ? `?${qs}` : ''}`)
}

/** Upload a review/geotag photo. Deliberately uses /api/upload/review-media, NOT
 * /api/upload — the latter is admin-only (see docs/MOBILE_API_MAPPING.md #7). */
export async function uploadPhoto(fileUri: string, fileName: string, mimeType: string): Promise<{ url: string; type: 'image' | 'video' }> {
  const token = await getToken()

  const form = new FormData()

  // React Native's FormData accepts this shape for file uploads.
  form.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob)

  const res = await fetch(`${API_BASE_URL}/upload/review-media`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error ?? 'Upload failed')
  }

  return data
}

export function submitGeotag(imageUrl: string, latitude?: number, longitude?: number) {
  return apiPost<GeoTagPhoto>('/geotag', { imageUrl, latitude, longitude })
}

export function getMyGeotagPhotos() {
  return apiGet<GeoTagPhoto[]>('/geotag')
}
