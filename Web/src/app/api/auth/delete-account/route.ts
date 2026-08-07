import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { logActivity } from '@/libs/activityLog'

export async function DELETE(req: Request) {
  try {
    const user = await requireUser()

    // Log deletion activity before we actually delete the user record
    await logActivity({
      userId: user.id,
      email: user.email || 'unknown',
      role: user.role,
      action: 'ACCOUNT_DELETED',
      details: 'User deleted their own account from the app.'
    })

    // Delete the user identity
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ success: true, message: 'Account successfully deleted.' })
  } catch (err) {
    return handleApiError(err)
  }
}
