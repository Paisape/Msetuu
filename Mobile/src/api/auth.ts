import { apiPost, setToken } from './client'
import type { AuthUser } from './types'

/**
 * Logs in against /api/mobile/login (not /api/login — that endpoint is only used
 * internally by the web app's NextAuth Credentials provider and returns no token).
 * Stores the returned bearer token so subsequent apiRequest calls are authenticated.
 */
export async function login(email: string, password: string, otp?: string): Promise<AuthUser> {
  const res = await apiPost<{ token: string; user: AuthUser }>('/mobile/login', { email, password, otp })

  await setToken(res.token)

  return res.user
}

export async function logout(): Promise<void> {
  await setToken(null)
}

export async function register(name: string, email: string, password: string, phone?: string) {
  return apiPost<{ user: AuthUser; requireVerification: true }>('/auth/register', { name, email, password, phone })
}

export async function verifyEmail(email: string, otp: string) {
  return apiPost<{ message: string }>('/auth/verify-email', { email, otp })
}
