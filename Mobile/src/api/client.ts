import AsyncStorage from '@react-native-async-storage/async-storage'

// Point this at your deployed Next.js backend. During local development on a physical
// device/emulator, `localhost` won't reach your dev machine — use your machine's LAN IP
// instead, e.g. http://192.168.1.10:3003
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://www.mandirsetuu.com/api'

const SESSION_TOKEN_KEY = 'mandirsetu_session_token'

// NOTE: AsyncStorage is unencrypted on-device storage. For a production build, swap
// this for `expo-secure-store` (Keychain/Keystore-backed) so the bearer token isn't
// readable by other apps with filesystem access. Kept as AsyncStorage here to match
// the existing scaffold and avoid adding a native dependency that needs
// `npx expo install` before this project runs for the first time.
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_TOKEN_KEY)
}

export async function setToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token)
  } else {
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Core request helper. Attaches the mobile bearer token (issued by POST
 * /api/mobile/login) to every request when present. Backend error shape is
 * inconsistent across routes ({error: string} almost everywhere, {message: string[]}
 * on the legacy /api/login route), so both are normalized into a single ApiError.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : (data?.error ?? `Request failed with status ${res.status}`)

    throw new ApiError(message, res.status)
  }

  return data as T
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined })
}
