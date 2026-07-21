import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdminApi } from '@/libs/api-auth'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const includeAll = searchParams.get('includeAll') === 'true'

    const where = includeAll ? {} : { active: true }

    const items = await prisma.vrMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(items)
  } catch (err: any) {
    console.error('[api/vr GET] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch VR media items.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminApi()

    const body = await req.json()
    const { title, description, mediaType, mediaUrl, thumbnailUrl, active, slug } = body

    if (!title || !mediaUrl) {
      return NextResponse.json({ error: 'Title and Media URL are required.' }, { status: 400 })
    }

    let finalSlug = slug ? slugify(slug) : slugify(title)
    if (!finalSlug) {
      finalSlug = `vr-${Date.now()}`
    }

    // Ensure slug uniqueness
    const existing = await prisma.vrMedia.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      finalSlug = `${finalSlug}-${Math.floor(Math.random() * 1000)}`
    }

    const newItem = await prisma.vrMedia.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        mediaType: mediaType || 'VR_360_IMAGE',
        mediaUrl: mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null,
        active: active !== undefined ? Boolean(active) : true
      }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (err: any) {
    console.error('[api/vr POST] Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create VR media item.' }, { status: 500 })
  }
}
