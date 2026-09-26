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

const FALLBACK_POSTS: BlogPostItem[] = [
  {
    id: 'sample-1',
    slug: 'significance-of-offering-oil-kala-til-shani-dev',
    title: 'The Sacred Significance of Offering Mustard Oil and Kala Til to Shani Dev',
    excerpt:
      'Discover why offering mustard oil (Telabhishekam) and black sesame seeds (Kala Til) on Saturdays pacifies Shani Sade Sati and brings peace, prosperity, and karmic balance.',
    content: `<p>Lord Shani, the dispenser of karma in Vedic astrology, rewards discipline, honesty, and spiritual surrender while removing arrogance and worldly delusions.</p>
<h3>Why Mustard Oil is Offered to Shani Maharaj</h3>
<p>According to ancient Puranic legends, during the Ramayana era, Lord Hanuman rescued Shani Dev from Ravana's imprisonment. During the fierce battle, Shani Dev suffered severe bodily wounds. Lord Hanuman applied pure mustard oil to Shani Dev's wounds to relieve his intense burning sensation. Touched by Hanuman ji's devotion and seva, Shani Dev declared that anyone who lovingly offers mustard oil to him—especially on Saturdays—will be protected from the harsh afflictions of Sade Sati and Dhaiya.</p>
<h3>The Vedic Power of Kala Til (Black Sesame Seeds)</h3>
<p>Black sesame seeds possess strong planetary resonance with Saturn. In Vedic Havans and Chadhava, Kala Til absorbs negative energies, cleanses ancestral debts (Pitri Dosha), and bestows longevity and inner strength.</p>
<h3>How to Perform the Offering</h3>
<ul>
<li>Bathe early on Saturday morning before sunrise or at twilight.</li>
<li>Offer pure mustard oil with black sesame seeds at a consecrated Shani temple.</li>
<li>Chant the Shani Gayatri Mantra or the Beej Mantra: <em>"Om Sham Shanaishcharaye Namah"</em> 108 times.</li>
<li>Feed crows or offer food to the needy as a gesture of unconditional charity.</li>
</ul>`,
    featuredImage: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop',
    category: 'Chadhava',
    tags: 'Shani Dev, Chadhava, Mustard Oil, Kala Til, Astrology, Sade Sati',
    authorName: 'Acharya Pt. Ramesh Shastri',
    readTimeMinutes: 5,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    viewsCount: 342
  },
  {
    id: 'sample-2',
    slug: 'benefits-of-rudrabhishek-puja-kashi-vishwanath',
    title: 'Immense Spiritual Benefits of Rudrabhishek Puja at Kashi Vishwanath',
    excerpt:
      'Learn about the transformative vibrations of Maha Rudrabhishek performed by Vedic Acharyas with Panchamrit at the sacred Jyotirlinga of Kashi Vishwanath.',
    content: `<p>Rudrabhishek is one of the most powerful and auspicious Vedic rituals dedicated to Lord Shiva. When performed at Kashi Vishwanath—the eternal cosmic city of Lord Shiva—the spiritual merits multiply manifold.</p>
<h3>What is Rudrabhishek?</h3>
<p>The term 'Rudra' refers to the fierce, transformative manifestation of Lord Shiva, while 'Abhishek' means ritualistic sacred bathing with holy substances including Gangajal, milk, curd, honey, ghee, sugarcane juice, and sacred vibhuti.</p>
<h3>Key Spiritual Benefits</h3>
<ul>
<li>Neutralizes planetary doshas and negative cosmic influences.</li>
<li>Brings harmony, good health, and longevity to the entire family.</li>
<li>Removes financial obstacles and career hurdles through divine grace.</li>
<li>Fulfills genuine sankalpas and deep spiritual aspirations.</li>
</ul>`,
    featuredImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop',
    category: 'E-Puja',
    tags: 'Lord Shiva, Rudrabhishek, Kashi Vishwanath, E-Puja, Vedic Rituals',
    authorName: 'Dr. Ananya Sharma',
    readTimeMinutes: 4,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    viewsCount: 512
  },
  {
    id: 'sample-3',
    slug: 'understanding-navagraha-shanti-vedic-astrology',
    title: 'Understanding Navagraha Shanti: Harmonizing the Nine Planetary Energies',
    excerpt:
      'Explore how each of the nine celestial planets (Navagrahas) influences your life path and how personalized Vedic pujas restore cosmic alignment.',
    content: `<p>In Vedic astrology (Jyotish), our earthly experiences, health, prosperity, and challenges are deeply intertwined with the cosmic rhythms of the Navagrahas—Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu, and Ketu.</p>
<h3>Why Navagraha Shanti is Essential</h3>
<p>When planetary alignments in your Janam Kundli are afflicted or placed in unfavorable houses, anushthans and dedicated Navagraha pujas channel specific sound vibrations (mantras) and yagnas to calm hostile planetary rays and enhance beneficial influences.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
    category: 'Jyotish & Astrology',
    tags: 'Navagraha, Kundli, Jyotish, Vedic Astrology, Remedial Pujas',
    authorName: 'Jyotish Ratna Pt. Alok Kumar',
    readTimeMinutes: 6,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    viewsCount: 289
  }
]

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

  return FALLBACK_POSTS
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
