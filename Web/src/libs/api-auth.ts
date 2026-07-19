import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

/**
 * Resolves the currently authenticated user (from the NextAuth session) against the
 * database, or null if the request is unauthenticated. Always re-checks the DB rather
 * than trusting the JWT role blindly, since roles can change after the token was issued.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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

export function handleApiError(err: unknown) {
  if (err instanceof ApiAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }

  const message = err instanceof Error ? err.message : 'Something went wrong.'

  return NextResponse.json({ error: message }, { status: 500 })
}
