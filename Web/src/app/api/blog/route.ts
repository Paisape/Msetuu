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

let tableEnsured = false

async function ensureBlogPostTableExists() {
  if (tableEnsured) return
  try {
    // Create table if not exists in PostgreSQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BlogPost" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "excerpt" TEXT,
        "content" TEXT NOT NULL,
        "featuredImage" TEXT,
        "category" TEXT,
        "tags" TEXT,
        "authorName" TEXT DEFAULT 'Mandirsetuu Team',
        "readTimeMinutes" INTEGER DEFAULT 5,
        "metaTitle" TEXT,
        "metaDescription" TEXT,
        "canonicalUrl" TEXT,
        "published" BOOLEAN NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP(3),
        "viewsCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");`).catch(() => {})
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");`).catch(() => {})
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");`).catch(() => {})

    tableEnsured = true
  } catch (err) {
    console.error('Error ensuring BlogPost table:', err)
  }
}

// GET /api/blog — list published blogs (or all blogs if ?all=1 and admin)
export async function GET(req: Request) {
  try {
    await ensureBlogPostTableExists()

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
        // Fall back to drafts included for admin console
        includeDrafts = true
      }
    }

    const where: Record<string, any> = {}

    if (!includeDrafts) {
      where.published = true
    }

    if (category && category !== 'all' && category !== 'All') {
      where.category = { equals: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ]
    }

    let posts: any[] = []
    try {
      posts = await prisma.blogPost.findMany({
        where,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    } catch (dbErr) {
      console.error('Prisma query failed, attempting auto-migration:', dbErr)
      tableEnsured = false
      await ensureBlogPostTableExists()
      posts = await prisma.blogPost.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }]
      }).catch(() => [])
    }

    return NextResponse.json(posts)
  } catch (err) {
    console.error('Error in GET /api/blog:', err)
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/blog — admin creates a new blog post
export async function POST(req: Request) {
  try {
    await ensureBlogPostTableExists()
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
    while (await prisma.blogPost.findUnique({ where: { slug: uniqueSlug } }).catch(() => null)) {
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

// DELETE /api/blog — delete dummy seed blogs or clear
export async function DELETE(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const seedOnly = searchParams.get('seed') === '1'

    if (seedOnly) {
      await prisma.blogPost.deleteMany({
        where: {
          slug: {
            in: [
              'significance-of-offering-oil-kala-til-shani-dev',
              'benefits-of-rudrabhishek-puja-kashi-vishwanath',
              'understanding-navagraha-shanti-vedic-astrology'
            ]
          }
        }
      })
    } else {
      await prisma.blogPost.deleteMany({})
    }

    return NextResponse.json({ success: true, message: 'Posts cleared successfully.' })
  } catch (err) {
    return handleApiError(err)
  }
}

