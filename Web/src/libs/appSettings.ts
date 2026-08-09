import prisma from '@/libs/prisma'
import { encryptSetting, decryptSetting, isSettingsEncryptionConfigured } from '@/libs/settingsCrypto'

// Short-TTL in-memory cache. Config values like the Razorpay/SMTP keys are read on every single
// order/email — under real request volume, hitting Postgres for them on every request adds
// avoidable DB round-trips competing for the same connection pool as everything else. A 15s TTL
// keeps the admin form's "takes effect on the next request" promise close to true (worst case
// ~15s staleness from a *different* process/replica) while cutting the common case down to
// zero extra queries. `setSettings` also proactively invalidates on write, so the admin's own
// next request always sees the fresh value immediately, regardless of TTL.
const CACHE_TTL_MS = 15_000

type CacheEntry<T> = { value: T; expiresAt: number }

const settingCache = new Map<string, CacheEntry<string | undefined>>()
const categoryCache = new Map<string, CacheEntry<Record<string, string>>>()

const settingCacheKey = (category: string, key: string) => `${category}:${key}`

function invalidateCategory(category: string) {
  categoryCache.delete(category)

  for (const cacheKey of settingCache.keys()) {
    if (cacheKey.startsWith(`${category}:`)) settingCache.delete(cacheKey)
  }
}

// Reads every key in a category (PG, EMAIL, SMS) and returns them decrypted, keyed by `key`.
// Never throws on a single bad row — a corrupt/undecryptable value is dropped rather than
// taking down the whole settings read (callers fall back to env vars for anything missing).
export async function getSettingsForCategory(category: string): Promise<Record<string, string>> {
  const cached = categoryCache.get(category)

  if (cached && cached.expiresAt > Date.now()) return cached.value

  const rows = await prisma.appSetting.findMany({ where: { category } })
  const result: Record<string, string> = {}

  for (const row of rows) {
    try {
      result[row.key] = decryptSetting(row.value)
    } catch (err) {
      console.error(`[appSettings] Failed to decrypt ${category}.${row.key}:`, err)
    }
  }

  categoryCache.set(category, { value: result, expiresAt: Date.now() + CACHE_TTL_MS })

  return result
}

export async function getSetting(category: string, key: string): Promise<string | undefined> {
  const cacheKey = settingCacheKey(category, key)
  const cached = settingCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) return cached.value

  const row = await prisma.appSetting.findUnique({ where: { category_key: { category, key } } })

  let value: string | undefined

  if (row) {
    try {
      value = decryptSetting(row.value)
    } catch (err) {
      console.error(`[appSettings] Failed to decrypt ${category}.${key}:`, err)
    }
  }

  settingCache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS })

  return value
}

// DB value (if configured) wins; otherwise falls back to the given env var. This is the pattern
// every secret-consuming lib (razorpay.ts, mailer.ts) should use so the admin panel can
// override .env without a restart, but a fresh install with only .env set still works.
export async function getSettingOrEnv(category: string, key: string, envVarName: string): Promise<string | undefined> {
  const fromDb = await getSetting(category, key)

  if (fromDb) return fromDb

  return process.env[envVarName]
}

// Bulk upsert — used by the PG/Email/SMS admin forms. Values are encrypted before storage.
// Throws if SETTINGS_ENCRYPTION_KEY isn't configured, since silently storing plaintext secrets
// would defeat the entire point of this store.
export async function setSettings(category: string, values: Record<string, string>, updatedById?: string): Promise<void> {
  if (!isSettingsEncryptionConfigured()) {
    throw new Error('SETTINGS_ENCRYPTION_KEY is not configured on the server — cannot securely store settings.')
  }

  try {
    await Promise.all(
      Object.entries(values).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { category_key: { category, key } },
          create: { category, key, value: encryptSetting(value), updatedById },
          update: { value: encryptSetting(value), updatedById }
        })
      )
    )
  } finally {
    // Bust the cache even on a partial failure (some upserts in the batch may have already
    // committed before one rejected) — an admin retrying after an error must never read back a
    // value that's stale relative to whichever writes did succeed.
    invalidateCategory(category)
  }
}
