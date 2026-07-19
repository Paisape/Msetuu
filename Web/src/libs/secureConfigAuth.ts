import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'
import { sendEmail } from '@/libs/email'
import { secureConfigOtpEmail } from '@/libs/emailTemplates'

const SINGLETON_ID = 'singleton'
const ROTATION_DAYS = 15
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getOtpRecipient(): string {
  return process.env.SECURE_CONFIG_OTP_EMAIL || 'bmrjjn@gmail.com'
}

// Lazily creates the singleton auth row on first access, seeded from
// SECURE_CONFIG_INITIAL_PASSWORD (.env) — this is a one-time bootstrap only; every rotation
// after that lives entirely in the database. If the env var is missing when no row exists yet,
// the Config menu is simply inaccessible until it's set (fail closed, not open).
async function getOrCreateAuthRow() {
  const existing = await prisma.secureConfigAuth.findUnique({ where: { id: SINGLETON_ID } })

  if (existing) return existing

  const bootstrapPassword = process.env.SECURE_CONFIG_INITIAL_PASSWORD

  if (!bootstrapPassword) {
    throw new Error('Secure Config has not been set up yet — set SECURE_CONFIG_INITIAL_PASSWORD in .env once, then it can be rotated from the admin panel.')
  }

  const passwordHash = await bcrypt.hash(bootstrapPassword, 12)

  return prisma.secureConfigAuth.create({ data: { id: SINGLETON_ID, passwordHash, lastChangedAt: new Date() } })
}

export async function getSecureConfigStatus(): Promise<{ rotationRequired: boolean; daysSinceChange: number }> {
  const row = await getOrCreateAuthRow()
  const daysSinceChange = Math.floor((Date.now() - row.lastChangedAt.getTime()) / (24 * 60 * 60 * 1000))

  return { rotationRequired: daysSinceChange >= ROTATION_DAYS, daysSinceChange }
}

export async function verifySecureConfigPassword(password: string): Promise<boolean> {
  const row = await getOrCreateAuthRow()

  return bcrypt.compare(password, row.passwordHash)
}

// Generates a 6-digit OTP, stores its hash (never the raw code) with a 10-minute expiry, and
// emails it to the fixed recovery address. Only used for the mandatory 15-day rotation — never
// for routine day-to-day unlocks.
export async function requestRotationOtp(): Promise<void> {
  await getOrCreateAuthRow()

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpCodeHash = await bcrypt.hash(otp, 10)
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS)

  await prisma.secureConfigAuth.update({ where: { id: SINGLETON_ID }, data: { otpCodeHash, otpExpiresAt } })

  const { subject, html } = secureConfigOtpEmail({ otp })
  const result = await sendEmail({ to: getOtpRecipient(), subject, html })

  if (!result.sent) {
    throw new Error(`Failed to send the OTP email: ${result.reason}`)
  }
}

// Verifies the OTP and, if valid, rotates the password and clears the OTP fields. Throws with a
// user-facing message on any failure — expired/missing OTP, wrong code, or a weak new password.
export async function confirmRotation(otp: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.')
  }

  const row = await getOrCreateAuthRow()

  if (!row.otpCodeHash || !row.otpExpiresAt) {
    throw new Error('No OTP was requested. Please request a new one.')
  }

  if (row.otpExpiresAt.getTime() < Date.now()) {
    throw new Error('This OTP has expired. Please request a new one.')
  }

  const otpMatches = await bcrypt.compare(otp, row.otpCodeHash)

  if (!otpMatches) {
    throw new Error('Incorrect OTP.')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.secureConfigAuth.update({
    where: { id: SINGLETON_ID },
    data: { passwordHash, lastChangedAt: new Date(), otpCodeHash: null, otpExpiresAt: null }
  })
}
