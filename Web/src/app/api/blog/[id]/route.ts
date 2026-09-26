import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/blog/[id] — retrieve single post by id or slug
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params

    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 })
    }

    if (!post.published) {
      try {
        await requireAdmin()
      } catch {
        return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 })
      }
    }

    // Increment view count in background
    prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {})

    return NextResponse.json(post)
  } catch (err) {
    return handleApiError(err)
  }
}

// PATCH /api/blog/[id] — update blog post
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 })
    }

    const data: Record<string, any> = {}

    if (body.title !== undefined) data.title = body.title
    if (body.excerpt !== undefined) data.excerpt = body.excerpt || null
    if (body.content !== undefined) data.content = body.content
    if (body.featuredImage !== undefined) data.featuredImage = body.featuredImage || null
    if (body.category !== undefined) data.category = body.category || 'Devotional'
    if (body.tags !== undefined) data.tags = body.tags || null
    if (body.authorName !== undefined) data.authorName = body.authorName || 'Mandirsetuu Team'
    if (body.readTimeMinutes !== undefined) data.readTimeMinutes = body.readTimeMinutes ? Number(body.readTimeMinutes) : null
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle || null
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription || null
    if (body.canonicalUrl !== undefined) data.canonicalUrl = body.canonicalUrl || null

    if (body.slug !== undefined && body.slug !== existing.slug) {
      let finalSlug = slugify(body.slug || body.title || existing.title)
      let uniqueSlug = finalSlug
      let counter = 1
      while (true) {
        const check = await prisma.blogPost.findUnique({ where: { slug: uniqueSlug } })
        if (!check || check.id === existing.id) break
        uniqueSlug = `${finalSlug}-${counter}`
        counter++
      }
      data.slug = uniqueSlug
    }

    if (body.published !== undefined) {
      const isPublished = Boolean(body.published)
      data.published = isPublished
      if (isPublished && !existing.publishedAt) {
        data.publishedAt = new Date()
      }
    }

    const updated = await prisma.blogPost.update({
      where: { id: existing.id },
      data
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/blog/[id] — delete blog post
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const existing = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 })
    }

    await prisma.blogPost.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
