import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type RouteContext = { params: Promise<{ id: string }> }

// PUT /api/mantra/[id] — admin update
export async function PUT(req: Request, context: RouteContext) {
  try {
    await requireAdmin()

    const { id } = await context.params
    const body = await req.json()
    const { title, subtitle, fileUrl, duration, deity } = body

    if (!title || !subtitle || !fileUrl || !duration || !deity) {
      return NextResponse.json({ error: 'All fields (title, subtitle, fileUrl, duration, deity) are required.' }, { status: 400 })
    }

    const mantra = await prisma.mantra.update({
      where: { id },
      data: {
        title,
        subtitle,
        fileUrl,
        duration,
        deity
      }
    })

    return NextResponse.json(mantra)
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/mantra/[id] — admin delete
export async function DELETE(req: Request, context: RouteContext) {
  try {
    await requireAdmin()

    const { id } = await context.params

    await prisma.mantra.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
