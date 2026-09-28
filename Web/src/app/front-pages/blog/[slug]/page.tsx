import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/libs/prisma'
import ShareButtons from './ShareButtons'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop'

async function getPostBySlug(slug: string) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        published: true
      }
    })

    if (post) {
      // Increment views count asynchronously
      prisma.blogPost
        .update({
          where: { id: post.id },
          data: { viewsCount: { increment: 1 } }
        })
        .catch(() => {})

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        category: post.category,
        tags: post.tags,
        authorName: post.authorName,
        readTimeMinutes: post.readTimeMinutes,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        canonicalUrl: post.canonicalUrl,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        viewsCount: post.viewsCount
      }
    }
  } catch (err) {
    console.error('Error fetching blog post by slug:', err)
  }

  return null
}

async function getRelatedPosts(currentSlug: string, category?: string | null) {
  try {
    const related = await prisma.blogPost.findMany({
      where: {
        slug: { not: currentSlug },
        published: true,
        ...(category ? { category } : {})
      },
      take: 3,
      orderBy: { publishedAt: 'desc' }
    })

    if (related && related.length > 0) return related
  } catch {
    // Return empty if no related posts
  }

  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Article Not Found | Mandirsetuu Blog',
      description: 'The requested spiritual article could not be found.'
    }
  }

  const title = post.metaTitle || `${post.title} | Mandirsetuu Blog`
  const description = post.metaDescription || post.excerpt || post.title
  const image = post.featuredImage || DEFAULT_IMAGE
  const url = `https://mandirsetuu.com/blog/${post.slug}`
  const tagsList = post.tags ? post.tags.split(',').map((t: string) => t.trim()) : undefined

  return {
    title,
    description,
    keywords: tagsList,
    alternates: {
      canonical: post.canonicalUrl || url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Mandirsetuu',
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName || 'Mandirsetuu Team'],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      locale: 'en_IN'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  }
}

export default async function BlogPostPage(props: Props) {
  const params = await props.params
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category)
  const currentUrl = `https://mandirsetuu.com/blog/${post.slug}`
  const tagList = post.tags ? post.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []

  // Google JSON-LD schema for BlogPosting
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    image: [post.featuredImage || DEFAULT_IMAGE],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    articleSection: post.category || 'Devotional',
    keywords: post.tags || undefined,
    timeRequired: `PT${post.readTimeMinutes || 5}M`,
    author: {
      '@type': 'Person',
      name: post.authorName || 'Mandirsetuu Team',
      url: 'https://mandirsetuu.com/about'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mandirsetuu',
      url: 'https://mandirsetuu.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mandirsetuu.com/images/mandirsetuu-logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl
    }
  }

  // Google JSON-LD schema for Breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://mandirsetuu.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://mandirsetuu.com/blog'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: currentUrl
      }
    ]
  }

  return (
    <article className='min-h-screen bg-white'>
      {/* JSON-LD Schemas */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb Bar */}
      <div className='bg-emerald-50/50 border-b border-emerald-100/60 py-3.5'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs sm:text-sm text-slate-500'>
          <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
            <Link href='/' className='hover:text-[#006241] whitespace-nowrap'>
              Home
            </Link>
            <span>/</span>
            <Link href='/blog' className='hover:text-[#006241] whitespace-nowrap'>
              Blog
            </Link>
            {post.category && (
              <>
                <span>/</span>
                <Link
                  href={`/blog?category=${encodeURIComponent(post.category)}`}
                  className='text-[#006241] font-semibold hover:underline whitespace-nowrap'
                >
                  {post.category}
                </Link>
              </>
            )}
          </div>

          <Link
            href='/blog'
            className='hidden sm:inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#006241]'
          >
            &larr; All Articles
          </Link>
        </div>
      </div>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14'>
        {/* Article Meta Bar */}
        <div className='flex items-center gap-3 text-xs sm:text-sm text-slate-500 mb-4'>
          {post.category && (
            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              className='px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-[#006241] hover:bg-emerald-200 transition-colors'
            >
              {post.category}
            </Link>
          )}
          <span>•</span>
          <span>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recently Published'}
          </span>
          <span>•</span>
          <span>⏳ {post.readTimeMinutes || 5} min read</span>
        </div>

        {/* Article Heading */}
        <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6'>
          {post.title}
        </h1>

        {/* Lead Excerpt */}
        {post.excerpt && (
          <p className='text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-8 border-l-4 border-[#006241] pl-4 py-1 italic bg-emerald-50/30 rounded-r-lg'>
            {post.excerpt}
          </p>
        )}

        {/* Author Card & Social Share Bar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-y border-slate-200/80 mb-8'>
          <div className='flex items-center gap-3'>
            <div className='w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-[#006241] font-bold text-base shadow-sm'>
              {post.authorName ? post.authorName.charAt(0) : 'M'}
            </div>
            <div>
              <div className='font-bold text-sm text-slate-900'>
                {post.authorName || 'Mandirsetuu Team'}
              </div>
              <div className='text-xs text-slate-500'>Vedic Scholar &amp; Astrological Expert</div>
            </div>
          </div>

          <ShareButtons title={post.title} url={currentUrl} />
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className='rounded-3xl overflow-hidden shadow-lg border border-slate-200/70 mb-10 max-h-[460px]'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredImage}
              alt={post.title}
              className='w-full h-full object-cover'
            />
          </div>
        )}

        {/* Article Body Content */}
        <div
          className='prose prose-slate lg:prose-lg max-w-none text-slate-800 leading-relaxed space-y-6
            [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:font-bold [&_h2]:text-[#006241] [&_h2]:mt-10 [&_h2]:mb-4
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:mb-4 [&_p]:text-slate-700 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-6
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-6
            [&_li]:text-slate-700
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#006241] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600
            [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:my-6
          '
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Interactive Tags Section */}
        {tagList.length > 0 && (
          <div className='mt-10 pt-6 border-t border-slate-200 flex items-center flex-wrap gap-2'>
            <span className='text-xs font-bold text-slate-400 uppercase tracking-wider mr-1'>
              🏷️ Tags:
            </span>
            {tagList.map((tag: string, idx: number) => (
              <Link
                key={idx}
                href={`/blog?search=${encodeURIComponent(tag)}`}
                className='px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-colors'
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Devotional CTA Box */}
        <div className='my-14 rounded-3xl p-8 sm:p-10 bg-emerald-900 text-white shadow-xl relative overflow-hidden'>
          <div className='absolute -right-8 -bottom-8 text-8xl opacity-10 pointer-events-none'>
            🛕
          </div>
          <div className='relative z-10 max-w-xl space-y-3'>
            <span className='text-3xl'>🙏</span>
            <h3 className='text-2xl font-bold'>Perform Personalized Vedic Rituals Online</h3>
            <p className='text-emerald-100 text-sm leading-relaxed'>
              Mandirsetuu connects you directly to verified Vedic priests across India’s holiest shrines. Receive live video sankalp and sacred prasad delivered home.
            </p>
            <div className='flex flex-wrap gap-3 pt-4'>
              <Link
                href='/front-pages/epuja'
                className='px-6 py-2.5 bg-white text-emerald-900 font-bold rounded-xl text-sm hover:bg-emerald-50 transition-colors shadow-md'
              >
                Book E-Puja
              </Link>
              <Link
                href='/front-pages/chadhava'
                className='px-6 py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-sm border border-emerald-600 hover:bg-emerald-700 transition-colors'
              >
                Offer Chadhava
              </Link>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className='mt-16 pt-10 border-t border-slate-200'>
            <h3 className='text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
              <span>🪔</span> Related Spiritual Insights
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {relatedPosts.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className='group bg-slate-50 rounded-2xl p-4 border border-slate-200/80 hover:shadow-md hover:bg-white transition-all flex flex-col justify-between'
                >
                  <div>
                    <div className='h-36 rounded-xl overflow-hidden mb-3'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.featuredImage || DEFAULT_IMAGE}
                        alt={item.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                    </div>
                    <span className='text-[11px] font-bold text-[#006241] uppercase tracking-wider'>
                      {item.category || 'Vedic'}
                    </span>
                    <h4 className='text-sm font-bold text-slate-900 group-hover:text-[#006241] transition-colors line-clamp-2 mt-1'>
                      {item.title}
                    </h4>
                  </div>
                  <span className='text-xs font-bold text-[#006241] mt-3 inline-block'>
                    Read Article &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
