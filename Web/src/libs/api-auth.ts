import { headers } from 'next/headers'

import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { decode } from 'next-auth/jwt'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

/**
 * Resolves the caller's email from a mobile bearer token, if present.
 *
 * Mobile clients can't use the HttpOnly session cookie the web app relies on, so
 * they authenticate via `Authorization: Bearer <token>` instead, where the token is
 * a NextAuth-compatible JWT minted by POST /api/mobile/login. Decoding it with the
 * same NEXTAUTH_SECRET reconstructs the same payload NextAuth would have put in the
 * session cookie, so every route below stays agnostic to which transport was used.
 */
async function getEmailFromBearerToken(): Promise<string | null> {
  const headerList = await headers()
  const authHeader = headerList.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) return null

  const secret = process.env.NEXTAUTH_SECRET

  if (!secret) return null

  try {
    const payload = await decode({ token: authHeader.slice('Bearer '.length), secret })

    return typeof payload?.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}

/**
 * Resolves the currently authenticated user (from the NextAuth session cookie, or a
 * mobile bearer token) against the database, or null if unauthenticated. Always
 * re-checks the DB rather than trusting the JWT role blindly, since roles can change
 * after the token was issued.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const bearerEmail = await getEmailFromBearerToken()

  let email = bearerEmail

  if (!email) {
    const session = await getServerSession(authOptions)

    email = session?.user?.email ?? null
  }

  if (!email) return null

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true }
  })

  if (!user) return null

  return user
}

/** Throws a Response-shaped error the route handler can return directly. */
export class ApiAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()

  if (!user) throw new ApiAuthError('You must be logged in to perform this action.', 401)

  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()

  if (user.role !== 'ADMIN') throw new ApiAuthError('Admin access required.', 403)

  return user
}

export const requireAdminApi = requireAdmin

export function handleApiError(err: unknown) {
  if (err instanceof ApiAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }

  const message = err instanceof Error ? err.message : 'Something went wrong.'

  return NextResponse.json({ error: message }, { status: 500 })
}
