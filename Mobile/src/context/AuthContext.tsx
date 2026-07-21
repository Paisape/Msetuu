import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import * as authApi from '../api/auth'
import { getToken } from '../api/client'
import type { AuthUser } from '../api/types'

type AuthContextValue = {
  user: AuthUser | null
  initializing: boolean
  login: (email: string, password: string, otp?: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // A stored token doesn't tell us who the user is (it's opaque to the client),
    // so on cold start we just check whether one exists; the first authenticated
    // API call will reveal an invalid/expired token via a 401.
    getToken()
      .catch(() => null)
      .finally(() => setInitializing(false))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      login: async (email, password, otp) => {
        const loggedInUser = await authApi.login(email, password, otp)

        setUser(loggedInUser)
      },
      logout: async () => {
        await authApi.logout()
        setUser(null)
      },
      setUser
    }),
    [user, initializing]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')

  return ctx
}
