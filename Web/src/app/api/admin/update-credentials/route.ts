import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'
import { logActivity } from '@/libs/activityLog'

// GET: Fetch current logged-in admin email
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 })
    }

    const userId = (session.user as any)?.id
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          { email: session.user?.email || '' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 })
    }

    return NextResponse.json({ email: user.email })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 })
  }
}

// POST: Update admin email address and/or password
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access. Only admins can modify admin credentials.' }, { status: 401 })
    }

    const { currentPassword, newEmail, newPassword } = await req.json()

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required to confirm changes.' }, { status: 400 })
    }

    const userId = (session.user as any)?.id
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          { email: session.user?.email || '' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 })
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Incorrect current password. Verification failed.' }, { status: 400 })
    }

    const updateData: { email?: string; password?: string; emailVerified?: Date } = {}

    // Process new email address
    if (newEmail && newEmail.trim() !== '' && newEmail.trim().toLowerCase() !== user.email?.toLowerCase()) {
      const trimmedEmail = newEmail.trim().toLowerCase()

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 })
      }

      const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } })
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'This email address is already in use by another user account.' }, { status: 400 })
      }

      updateData.email = trimmedEmail
      updateData.emailVerified = new Date()
    }

    // Process new password
    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes were provided to update.' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })

    await logActivity({
      userId: user.id,
      email: updatedUser.email,
      role: user.role,
      action: 'UPDATE_ADMIN_CREDENTIALS',
      details: `Admin profile updated. Email: ${updatedUser.email}. Password updated: ${!!updateData.password}`
    })

    return NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully! Please use your new details for future logins.',
      newEmail: updatedUser.email
    })
  } catch (err: any) {
    console.error('[update-credentials] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 })
  }
}
