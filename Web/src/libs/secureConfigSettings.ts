import { getSettingsForCategory, setSettings } from '@/libs/appSettings'

// Shared field catalogue + redaction logic for the Config > PG/Email/SMS admin forms. Centralised
// here so every settings route (GET redact, POST save) enforces the exact same allow-list of keys
// per category — a route can never read/write a key that isn't declared below.
export type SettingsCategory = 'PG' | 'EMAIL' | 'SMS' | 'ASTROLOGY' | 'ADSENSE' | 'WHATSAPP' | 'FIREBASE'

type FieldDef = { key: string; secret: boolean; label: string }

const FIELD_DEFS: Record<SettingsCategory, FieldDef[]> = {
  PG: [
    { key: 'RAZORPAY_KEY_ID', secret: false, label: 'Razorpay Key ID' },
    { key: 'RAZORPAY_KEY_SECRET', secret: true, label: 'Razorpay Key Secret' }
  ],
  ADSENSE: [
    { key: 'ADSENSE_CLIENT_ID', secret: false, label: 'Google AdSense Publisher Client ID' },
    { key: 'ADSENSE_AUTO_ADS_ENABLED', secret: false, label: 'Enable Auto Ads (true / false)' },
    { key: 'ADSENSE_PREROLL_ENABLED', secret: false, label: 'Enable Pre-Roll Video/VR Ad (true / false)' },
    { key: 'ADSENSE_PREROLL_SECONDS', secret: false, label: 'Pre-Roll Ad Countdown Duration (Seconds, e.g. 5)' },
    { key: 'ADSENSE_OVERLAY_ADS_ENABLED', secret: false, label: 'Enable On-Screen Overlay Ad on Video/VR Player (true / false)' },
    { key: 'ADSENSE_PREROLL_SLOT_ID', secret: false, label: 'Pre-Roll & Overlay Ad Slot ID' },
    { key: 'ADSENSE_HEADER_SLOT_ID', secret: false, label: 'Top Banner Ad Slot ID' },
    { key: 'ADSENSE_BOTTOM_SLOT_ID', secret: false, label: 'Bottom Banner Ad Slot ID' },
    { key: 'ADSENSE_SIDEBAR_SLOT_ID', secret: false, label: 'Sidebar Ad Slot ID' }
  ],
  ASTROLOGY: [
    { key: 'ASTROLOGY_API_KEY', secret: true, label: 'FreeAstrologyAPI Key (Panchang/Choghadiya)' },
    { key: 'ASTROLOGYAPI_USER_ID', secret: false, label: 'AstrologyAPI.com User ID (Rashifal)' },
    { key: 'ASTROLOGYAPI_API_KEY', secret: true, label: 'AstrologyAPI.com API Key (Rashifal)' }
  ],
  EMAIL: [
    { key: 'SMTP_HOST', secret: false, label: 'SMTP Host' },
    { key: 'SMTP_PORT', secret: false, label: 'SMTP Port' },
    { key: 'SMTP_SECURE', secret: false, label: 'Use SSL' },
    { key: 'SMTP_USER', secret: false, label: 'SMTP Username' },
    { key: 'SMTP_PASSWORD', secret: true, label: 'SMTP Password' },
    { key: 'SMTP_FROM_NAME', secret: false, label: 'From Name' },
    { key: 'SMTP_FROM_EMAIL', secret: false, label: 'From Email' }
  ],
  SMS: [
    { key: 'SMS_PROVIDER', secret: false, label: 'SMS Provider' },
    { key: 'SMS_API_KEY', secret: true, label: 'SMS API Key' },
    { key: 'SMS_API_SECRET', secret: true, label: 'SMS API Secret' },
    { key: 'SMS_SENDER_ID', secret: false, label: 'Sender ID' }
  ],
  WHATSAPP: [
    { key: 'WHATSAPP_PROVIDER', secret: false, label: 'WhatsApp Provider (e.g. Meta Cloud API, Interakt, AiSensy)' },
    { key: 'WHATSAPP_API_KEY', secret: true, label: 'WhatsApp API Key / Access Token' },
    { key: 'WHATSAPP_PHONE_NUMBER_ID', secret: false, label: 'WhatsApp Phone Number ID' }
  ],
  FIREBASE: [
    { key: 'FIREBASE_PROJECT_ID', secret: false, label: 'Firebase Project ID' },
    { key: 'FIREBASE_SERVER_KEY', secret: true, label: 'Firebase Server Key (FCM Cloud Messaging)' }
  ]
}

export function getFieldDefs(category: SettingsCategory): FieldDef[] {
  return FIELD_DEFS[category]
}

function maskSecret(value: string): string {
  if (value.length <= 4) return '••••'

  return `••••${value.slice(-4)}`
}

export type RedactedField = { value: string; configured: boolean; source: 'db' | 'env' | 'none' }

// Never returns a secret's real value — only whether it's configured, its source, and (for
// secrets) a last-4-chars masked preview. Non-secret fields are returned as-is since they aren't
// sensitive (host names, port numbers, display names, etc).
export async function getRedactedSettings(category: SettingsCategory): Promise<Record<string, RedactedField>> {
  const fields = FIELD_DEFS[category]
  const dbValues = await getSettingsForCategory(category)
  const result: Record<string, RedactedField> = {}

  for (const f of fields) {
    const dbVal = dbValues[f.key]
    const envVal = process.env[f.key]
    const raw = dbVal || envVal
    const source: RedactedField['source'] = dbVal ? 'db' : envVal ? 'env' : 'none'

    result[f.key] = {
      value: raw ? (f.secret ? maskSecret(raw) : raw) : '',
      configured: Boolean(raw),
      source
    }
  }

  return result
}

export async function getResolvedSettings(category: SettingsCategory): Promise<Record<string, string>> {
  const fields = FIELD_DEFS[category]
  const dbValues = await getSettingsForCategory(category)
  const result: Record<string, string> = {}

  for (const f of fields) {
    result[f.key] = dbValues[f.key] || process.env[f.key] || ''
  }

  return result
}

// Saves only the fields that belong to this category and that the admin actually changed. Blank
// values and values matching the masked placeholder pattern (••••1234) are skipped, so re-saving
// the form without touching a secret field never overwrites it with a masked placeholder string.
export async function saveSettings(category: SettingsCategory, body: Record<string, unknown>, updatedById?: string): Promise<void> {
  const allowedKeys = new Set(FIELD_DEFS[category].map(f => f.key))
  const toSave: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(body)) {
    if (!allowedKeys.has(key)) continue
    if (typeof rawValue !== 'string') continue

    const value = rawValue.trim()

    if (!value) continue
    if (/^••••/.test(value)) continue

    toSave[key] = value
  }

  if (Object.keys(toSave).length === 0) return

  await setSettings(category, toSave, updatedById)
}
