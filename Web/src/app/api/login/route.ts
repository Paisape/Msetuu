// Next Imports
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/libs/prisma'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json(
        { message: ['Email or Password is invalid'] },
        { status: 401, statusText: 'Unauthorized Access' }
      )
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    // User may not exist, or may have registered via Google OAuth (no password set)
    if (!user || !user.password) {
      return NextResponse.json(
        { message: ['Email or Password is invalid'] },
        { status: 401, statusText: 'Unauthorized Access' }
      )
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { message: ['Email or Password is invalid'] },
        { status: 401, statusText: 'Unauthorized Access' }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { message: ['Please verify your email address before logging in.'] },
        { status: 403, statusText: 'Email Not Verified' }
      )
    }

    // Never return the password hash to the client
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role
    })
  } catch {
    return NextResponse.json(
      { message: ['Email or Password is invalid'] },
      { status: 401, statusText: 'Unauthorized Access' }
    )
  }
}
