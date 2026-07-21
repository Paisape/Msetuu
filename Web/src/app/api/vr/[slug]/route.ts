import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdminApi } from '@/libs/api-auth'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const item = await prisma.vrMedia.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'VR media item not found.' }, { status: 404 })
    }

    // Increment view count asynchronously
    await prisma.vrMedia.update({
      where: { id: item.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => null)

    return NextResponse.json(item)
  } catch (err: any) {
    console.error('[api/vr/[slug] GET] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch VR media item.' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdminApi()

    const { slug } = await params
    const body = await req.json()
    const { title, description, mediaType, mediaUrl, thumbnailUrl, active } = body

    const existing = await prisma.vrMedia.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'VR media item not found.' }, { status: 404 })
    }

    const updated = await prisma.vrMedia.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(mediaType !== undefined && { mediaType }),
        ...(mediaUrl !== undefined && { mediaUrl: mediaUrl.trim() }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null }),
        ...(active !== undefined && { active: Boolean(active) })
      }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('[api/vr/[slug] PUT] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update VR media item.' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdminApi()

    const { slug } = await params

    const existing = await prisma.vrMedia.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'VR media item not found.' }, { status: 404 })
    }

    await prisma.vrMedia.delete({
      where: { id: existing.id }
    })

    return NextResponse.json({ success: true, message: 'VR media item deleted successfully.' })
  } catch (err: any) {
    console.error('[api/vr/[slug] DELETE] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete VR media item.' }, { status: 500 })
  }
}
