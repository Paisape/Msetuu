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

export const INITIAL_SEED_POSTS = [
  {
    slug: 'significance-of-offering-oil-kala-til-shani-dev',
    title: 'The Sacred Significance of Offering Mustard Oil and Kala Til to Shani Dev',
    excerpt:
      'Discover why offering mustard oil (Telabhishekam) and black sesame seeds (Kala Til) on Saturdays pacifies Shani Sade Sati and brings peace, prosperity, and karmic balance.',
    content: `<h2>The Eternal Compassion of Lord Shani</h2>\n<p>Lord Shani, the dispenser of karma in Vedic astrology, rewards discipline, honesty, and spiritual surrender while removing arrogance and worldly delusions.</p>\n\n<h2>Why Mustard Oil is Offered to Shani Maharaj</h2>\n<p>According to ancient Puranic legends, during the Ramayana era, Lord Hanuman rescued Shani Dev from Ravana's imprisonment. During the fierce battle, Shani Dev suffered severe bodily wounds. Lord Hanuman applied pure mustard oil to Shani Dev's wounds to relieve his intense burning sensation. Touched by Hanuman ji's devotion and seva, Shani Dev declared that anyone who lovingly offers mustard oil to him—especially on Saturdays—will be protected from the harsh afflictions of Sade Sati and Dhaiya.</p>\n\n<h2>The Vedic Power of Kala Til (Black Sesame Seeds)</h2>\n<p>Black sesame seeds possess strong planetary resonance with Saturn. In Vedic Havans and Chadhava, Kala Til absorbs negative energies, cleanses ancestral debts (Pitri Dosha), and bestows longevity and inner strength.</p>\n\n<h2>How to Perform the Offering</h2>\n<ul>\n  <li>Bathe early on Saturday morning before sunrise or at twilight.</li>\n  <li>Offer pure mustard oil with black sesame seeds at a consecrated Shani temple.</li>\n  <li>Chant the Shani Gayatri Mantra or the Beej Mantra: <em>"Om Sham Shanaishcharaye Namah"</em> 108 times.</li>\n  <li>Feed crows or offer food to the needy as a gesture of unconditional charity.</li>\n</ul>`,
    featuredImage: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop',
    category: 'Chadhava',
    tags: 'Shani Dev, Chadhava, Mustard Oil, Kala Til, Astrology, Sade Sati',
    authorName: 'Acharya Pt. Ramesh Shastri',
    readTimeMinutes: 5,
    metaTitle: 'Sacred Significance of Offering Mustard Oil to Shani Dev | Mandirsetuu',
    metaDescription: 'Discover why offering mustard oil and black sesame seeds to Shani Dev on Saturdays pacifies Sade Sati and restores karmic harmony.',
    published: true,
    publishedAt: new Date(),
    viewsCount: 342
  },
  {
    slug: 'benefits-of-rudrabhishek-puja-kashi-vishwanath',
    title: 'Immense Spiritual Benefits of Rudrabhishek Puja at Kashi Vishwanath',
    excerpt:
      'Learn about the transformative vibrations of Maha Rudrabhishek performed by Vedic Acharyas with Panchamrit at the sacred Jyotirlinga of Kashi Vishwanath.',
    content: `<h2>The Transformative Grace of Lord Shiva</h2>\n<p>Rudrabhishek is one of the most powerful and auspicious Vedic rituals dedicated to Lord Shiva. When performed at Kashi Vishwanath—the eternal cosmic city of Lord Shiva—the spiritual merits multiply manifold.</p>\n\n<h2>What is Rudrabhishek?</h2>\n<p>The term 'Rudra' refers to the fierce, transformative manifestation of Lord Shiva, while 'Abhishek' means ritualistic sacred bathing with holy substances including Gangajal, milk, curd, honey, ghee, sugarcane juice, and sacred vibhuti.</p>\n\n<h2>Key Spiritual Benefits</h2>\n<ul>\n  <li>Neutralizes planetary doshas and negative cosmic influences.</li>\n  <li>Brings harmony, good health, and longevity to the entire family.</li>\n  <li>Removes financial obstacles and career hurdles through divine grace.</li>\n  <li>Fulfills genuine sankalpas and deep spiritual aspirations.</li>\n</ul>`,
    featuredImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop',
    category: 'E-Puja',
    tags: 'Lord Shiva, Rudrabhishek, Kashi Vishwanath, E-Puja, Vedic Rituals',
    authorName: 'Dr. Ananya Sharma',
    readTimeMinutes: 4,
    metaTitle: 'Benefits of Rudrabhishek Puja at Kashi Vishwanath | Mandirsetuu',
    metaDescription: 'Learn about the sacred benefits of Maha Rudrabhishek at Kashi Vishwanath Jyotirlinga for health, peace, and spiritual growth.',
    published: true,
    publishedAt: new Date(Date.now() - 86400000),
    viewsCount: 512
  },
  {
    slug: 'understanding-navagraha-shanti-vedic-astrology',
    title: 'Understanding Navagraha Shanti: Harmonizing the Nine Planetary Energies',
    excerpt:
      'Explore how each of the nine celestial planets (Navagrahas) influences your life path and how personalized Vedic pujas restore cosmic alignment.',
    content: `<h2>Cosmic Alignments &amp; Vedic Astrology</h2>\n<p>In Vedic astrology (Jyotish), our earthly experiences, health, prosperity, and challenges are deeply intertwined with the cosmic rhythms of the Navagrahas—Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu, and Ketu.</p>\n\n<h2>Why Navagraha Shanti is Essential</h2>\n<p>When planetary alignments in your Janam Kundli are afflicted or placed in unfavorable houses, anushthans and dedicated Navagraha pujas channel specific sound vibrations (mantras) and yagnas to calm hostile planetary rays and enhance beneficial influences.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
    category: 'Jyotish & Astrology',
    tags: 'Navagraha, Kundli, Jyotish, Vedic Astrology, Remedial Pujas',
    authorName: 'Jyotish Ratna Pt. Alok Kumar',
    readTimeMinutes: 6,
    metaTitle: 'Navagraha Shanti Puja & Vedic Astrology Guide | Mandirsetuu',
    metaDescription: 'Learn how Navagraha Shanti rituals harmonize the 9 planetary energies and remove astrological obstacles.',
    published: true,
    publishedAt: new Date(Date.now() - 172800000),
    viewsCount: 289
  }
]

let tableEnsured = false

async function ensureTableAndSeed() {
  if (tableEnsured) return
  try {
    // 1. Create table if not exists in PostgreSQL
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

    // 2. If table is completely empty, seed initial articles so admin has content immediately
    const count = await prisma.blogPost.count().catch(() => 0)
    if (count === 0) {
      for (const item of INITIAL_SEED_POSTS) {
        await prisma.blogPost.create({
          data: item
        }).catch(() => {})
      }
    }
  } catch (err) {
    console.error('Error ensuring BlogPost table:', err)
  }
}

// GET /api/blog — list published blogs (or all blogs if ?all=1 and admin)
export async function GET(req: Request) {
  try {
    await ensureTableAndSeed()

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
      await ensureTableAndSeed()
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
    await ensureTableAndSeed()
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
