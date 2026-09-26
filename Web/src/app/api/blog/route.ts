import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/blog — list published blogs (or all blogs if ?all=1 and admin)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const wantsAll = searchParams.get('all') === '1'

    let includeDrafts = false
    if (wantsAll) {
      try {
        await requireAdmin()
        includeDrafts = true
      } catch {
        // Not admin, stick to published
      }
    }

    const where: Record<string, any> = {}

    if (!includeDrafts) {
      where.published = true
    }

    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ]
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(posts)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/blog — admin creates a new blog post
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const {
      title,
      slug: customSlug,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      authorName,
      readTimeMinutes,
      metaTitle,
      metaDescription,
      canonicalUrl,
      published
    } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
    }

    let finalSlug = slugify(customSlug || title)
    if (!finalSlug) {
      finalSlug = `post-${Date.now()}`
    }

    // Ensure unique slug
    let uniqueSlug = finalSlug
    let counter = 1
    while (await prisma.blogPost.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${finalSlug}-${counter}`
      counter++
    }

    // Calculate approximate read time if not provided
    const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
    const calculatedReadTime = readTimeMinutes ? Number(readTimeMinutes) : Math.max(1, Math.ceil(words / 200))

    const isPublished = Boolean(published)

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: uniqueSlug,
        excerpt: excerpt || null,
        content,
        featuredImage: featuredImage || null,
        category: category || 'Devotional',
        tags: tags || null,
        authorName: authorName || 'Mandirsetuu Team',
        readTimeMinutes: calculatedReadTime,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || title,
        canonicalUrl: canonicalUrl || null,
        published: isPublished,
        publishedAt: isPublished ? new Date() : null
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
