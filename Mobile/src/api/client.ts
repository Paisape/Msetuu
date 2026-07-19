import AsyncStorage from '@react-native-async-storage/async-storage'

// Point this at your deployed Next.js backend. During local development on a physical
// device/emulator, `localhost` won't reach your dev machine — use your machine's LAN IP
// instead, e.g. http://192.168.1.10:3003
export const API_BASE_URL = 'http://localhost:3003/api'

const SESSION_TOKEN_KEY = 'mandirsetu_session_token'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY)

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders()

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers
    }
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed with status ${res.status}`)
  }

  return data as T
}

export async function login(email: string, password: string) {
  return apiRequest<{ id: string; name: string; email: string; role: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function register(name: string, email: string, password: string, phone?: string) {
  return apiRequest<{ user: { id: string; name: string; email: string; role: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone })
  })
}
