import type { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/libs/prisma'
import BlogListClient, { type BlogPostItem } from './BlogListClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Spiritual Blog & Vedic Insights | Mandirsetuu',
  description:
    'Explore authentic Vedic rituals, Puja vidhi, temple histories, Jyotish astrology insights, Vrat dates, and mantras from Mandirsetuu Vedic scholars.',
  keywords: [
    'Mandirsetuu blog',
    'Vedic rituals',
    'E-Puja vidhi',
    'Chadhava significance',
    'Hindu festivals',
    'Vrat katha',
    'Jyotish astrology tips',
    'Sacred temple darshan'
  ],
  openGraph: {
    title: 'Spiritual Blog & Vedic Wisdom | Mandirsetuu',
    description:
      'Explore authentic Vedic rituals, Puja vidhi, temple histories, Jyotish astrology insights, and sacred mantras.',
    url: 'https://mandirsetuu.com/blog',
    siteName: 'Mandirsetuu',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Mandirsetuu Spiritual Blog'
      }
    ],
    locale: 'en_IN',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spiritual Blog & Vedic Wisdom | Mandirsetuu',
    description: 'Explore authentic Vedic rituals, Puja vidhi, and temple insights from Mandirsetuu.',
    images: ['https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop']
  },
  alternates: {
    canonical: 'https://mandirsetuu.com/blog'
  }
}

async function getPublishedPosts(): Promise<BlogPostItem[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    })

    if (posts && posts.length > 0) {
      return posts.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        featuredImage: p.featuredImage,
        category: p.category,
        tags: p.tags,
        authorName: p.authorName,
        readTimeMinutes: p.readTimeMinutes,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        viewsCount: p.viewsCount
      }))
    }
  } catch (err) {
    console.error('Error loading blog posts from DB:', err)
  }

  return []
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()

  // Google JSON-LD structured data for Blog
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Mandirsetuu Spiritual Blog & Vedic Wisdom',
    description:
      'Explore authentic Vedic rituals, Puja vidhi, temple histories, Jyotish astrology insights, and sacred mantras.',
    url: 'https://mandirsetuu.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Mandirsetuu',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mandirsetuu.com/images/mandirsetuu-logo.png'
      }
    },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.title,
      url: `https://mandirsetuu.com/blog/${post.slug}`,
      datePublished: post.publishedAt || post.createdAt,
      author: {
        '@type': 'Person',
        name: post.authorName || 'Mandirsetuu Team'
      },
      image: post.featuredImage || 'https://mandirsetuu.com/images/mandirsetuu-logo.png'
    }))
  }

  return (
    <div className='min-h-screen bg-slate-50/50'>
      {/* JSON-LD Schema */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero Header */}
      <section
        className='relative overflow-hidden pt-20 pb-16 text-center'
        style={{ background: 'linear-gradient(180deg, #f0fdf6 0%, #ffffff 100%)' }}
      >
        <div className='max-w-4xl mx-auto px-4 sm:px-6'>
          <div
            className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-5'
            style={{
              background: 'rgba(16,185,129,0.1)',
              color: '#006241',
              border: '1px solid rgba(16,185,129,0.25)'
            }}
          >
            <span>📜</span> Vedic Wisdom, Rituals &amp; Temple Insights
          </div>

          <h1 className='text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-5 leading-tight'>
            Spiritual Sanctuary &amp;{' '}
            <span style={{ color: '#006241' }}>Vedic Knowledge</span>
          </h1>

          <p className='text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed'>
            Authentic guidance on temple rituals, Puja vidhi, sacred Chadhava, Jyotish astrology, and Hindu festival significance from verified Acharyas.
          </p>
        </div>
      </section>

      {/* Main Blog Client Component */}
      <BlogListClient initialPosts={posts} />

      {/* Bottom Devotional CTA */}
      <section className='py-16 max-w-6xl mx-auto px-4 sm:px-6 mb-16'>
        <div
          className='rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden text-white shadow-xl'
          style={{ background: 'linear-gradient(135deg, #006241 0%, #004e34 100%)' }}
        >
          <div className='max-w-2xl mx-auto space-y-4 relative z-10'>
            <span className='text-4xl inline-block'>🪔</span>
            <h3 className='text-2xl sm:text-3xl font-bold'>
              Experience the Divine in Your Daily Life
            </h3>
            <p className='text-white/90 text-sm sm:text-base leading-relaxed'>
              Book authentic E-Pujas at sacred shrines or offer Chadhava with your personal name and gotra sankalp today.
            </p>
            <div className='flex flex-wrap justify-center gap-4 pt-4'>
              <Link
                href='/front-pages/epuja'
                className='px-6 py-3 bg-white text-emerald-800 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-md text-sm'
              >
                Explore E-Pujas
              </Link>
              <Link
                href='/front-pages/chadhava'
                className='px-6 py-3 border border-white/50 text-white rounded-xl font-bold hover:bg-white/10 transition-colors text-sm'
              >
                Offer Sacred Chadhava
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
