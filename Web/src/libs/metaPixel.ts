/**
 * Meta (Facebook) Pixel Utility & Event Tracker
 * Pixel ID: 2111070683100026
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '2111070683100026'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: any
  }
}

/**
 * Standard Meta Pixel event tracking helper
 */
export function trackMetaEvent(
  eventName:
    | 'PageView'
    | 'ViewContent'
    | 'Search'
    | 'AddToCart'
    | 'AddToWishlist'
    | 'InitiateCheckout'
    | 'AddPaymentInfo'
    | 'Purchase'
    | 'Lead'
    | 'CompleteRegistration'
    | 'Contact'
    | string,
  options: Record<string, any> = {}
) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, options)
    } catch (err) {
      console.warn('[Meta Pixel] Tracking error for event:', eventName, err)
    }
  }
}

/**
 * Custom Meta Pixel event tracking helper
 */
export function trackMetaCustomEvent(eventName: string, options: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('trackCustom', eventName, options)
    } catch (err) {
      console.warn('[Meta Pixel] Custom tracking error:', eventName, err)
    }
  }
}
