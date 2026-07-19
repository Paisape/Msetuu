import prisma from '@/libs/prisma'
import { encryptSetting, decryptSetting, isSettingsEncryptionConfigured } from '@/libs/settingsCrypto'

// Reads every key in a category (PG, EMAIL, SMS) and returns them decrypted, keyed by `key`.
// Never throws on a single bad row — a corrupt/undecryptable value is dropped rather than
// taking down the whole settings read (callers fall back to env vars for anything missing).
export async function getSettingsForCategory(category: string): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany({ where: { category } })
  const result: Record<string, string> = {}

  for (const row of rows) {
    try {
      result[row.key] = decryptSetting(row.value)
    } catch (err) {
      console.error(`[appSettings] Failed to decrypt ${category}.${row.key}:`, err)
    }
  }

  return result
}

export async function getSetting(category: string, key: string): Promise<string | undefined> {
  const row = await prisma.appSetting.findUnique({ where: { category_key: { category, key } } })

  if (!row) return undefined

  try {
    return decryptSetting(row.value)
  } catch (err) {
    console.error(`[appSettings] Failed to decrypt ${category}.${key}:`, err)

    return undefined
  }
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

  await Promise.all(
    Object.entries(values).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { category_key: { category, key } },
        create: { category, key, value: encryptSetting(value), updatedById },
        update: { value: encryptSetting(value), updatedById }
      })
    )
  )
}
