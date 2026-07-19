import crypto from 'crypto'

import Razorpay from 'razorpay'

import { getSettingOrEnv } from '@/libs/appSettings'

// Thin wrapper around the official Razorpay Node SDK (sandbox/test mode — use test
// key_id/key_secret from Razorpay Dashboard > Settings > API Keys > Test Mode, or set them from
// the admin Config > PG menu). Test-mode payments run through Razorpay's real Checkout flow and
// signature scheme, just with no real money moving.
//
// IMPORTANT: there is deliberately no "mock"/simulated fallback anywhere in this file. If
// Razorpay isn't configured or a call fails, every function here throws — it never pretends a
// payment succeeded. A payment gate that fails open (silently treating an unconfigured or
// failed call as "verified") is a way to get anything for free, which defeats the entire point
// of adding a payment gateway.
//
// Keys are resolved DB-first (Config > PG, admin-editable, encrypted at rest) with .env as the
// fallback — see getSettingOrEnv. Nothing here is cached at module scope, since the whole point
// of the admin form is that a key change takes effect on the very next request.
async function resolveKeys(): Promise<{ keyId?: string; keySecret?: string }> {
  const [keyId, keySecret] = await Promise.all([
    getSettingOrEnv('PG', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_ID'),
    getSettingOrEnv('PG', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_KEY_SECRET')
  ])

  return { keyId, keySecret }
}

export async function getRazorpayKeyId(): Promise<string | undefined> {
  const { keyId } = await resolveKeys()

  return keyId
}

export async function isRazorpayConfigured(): Promise<boolean> {
  const { keyId, keySecret } = await resolveKeys()

  return Boolean(keyId && keySecret)
}

async function getClient(): Promise<Razorpay> {
  const { keyId, keySecret } = await resolveKeys()

  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Set it up under Config > PG, or RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in your environment.')
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

// Creates a Razorpay order for the given amount (rupees) and returns its order id. This must
// be called with a price we computed ourselves from the database — never a value sent by the
// client — so the amount the customer is shown at Razorpay Checkout is provably correct.
// Throws on any failure; callers must not catch this and substitute a fake order id.
export async function createRazorpayOrder(amountRupees: number, receipt: string): Promise<string> {
  const amountPaise = Math.round(amountRupees * 100)

  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new Error('Cannot create a Razorpay order for a non-positive amount.')
  }

  const client = await getClient()

  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    payment_capture: true
  })

  return order.id
}

// Verifies the HMAC-SHA256 signature Razorpay returns after a successful Checkout payment —
// the only proof that a given (order_id, payment_id) pair was genuinely paid. Returns false
// (never throws, never defaults to true) for any missing/malformed input, mismatched
// signature, or missing server configuration.
export async function verifyRazorpaySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): Promise<boolean> {
  const { keySecret } = await resolveKeys()

  if (!keySecret) return false
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false

  try {
    const expected = crypto.createHmac('sha256', keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf = Buffer.from(signature, 'hex')

    if (expectedBuf.length !== actualBuf.length) return false

    return crypto.timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}
