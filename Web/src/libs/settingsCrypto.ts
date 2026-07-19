import crypto from 'crypto'

// AES-256-GCM encryption for secrets stored in AppSetting.value (Razorpay keys, SMTP password,
// SMS API keys). SETTINGS_ENCRYPTION_KEY is a long random passphrase from .env — it is hashed
// down to a 32-byte key so any string length works. This key must never be committed to the
// database itself; it is the one secret that still has to live in .env.
const rawKey = process.env.SETTINGS_ENCRYPTION_KEY

function getKey(): Buffer {
  if (!rawKey) {
    throw new Error('SETTINGS_ENCRYPTION_KEY is not set. Add a long random secret to your .env before storing settings.')
  }

  return crypto.createHash('sha256').update(rawKey).digest()
}

export function isSettingsEncryptionConfigured(): boolean {
  return Boolean(rawKey)
}

// Returns "iv:authTag:ciphertext" (all base64) — self-contained, safe to store as a single
// string column.
export function encryptSetting(plainText: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptSetting(cipherText: string): string {
  const parts = cipherText.split(':')

  if (parts.length !== 3) {
    throw new Error('Malformed encrypted setting value.')
  }

  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)

  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])

  return decrypted.toString('utf8')
}
