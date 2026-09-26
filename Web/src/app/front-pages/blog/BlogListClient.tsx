'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'

export type BlogPostItem = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  category: string | null
  tags: string | null
  authorName: string | null
  readTimeMinutes: number | null
  publishedAt: string | null
  createdAt: string
  viewsCount: number
}

const CATEGORIES = [
  'All',
  'E-Puja',
  'Chadhava',
  'Vedic Wisdom',
  'Jyotish & Astrology',
  'Sacred Temples',
  'Festivals & Vrat',
  'Mantras & Slokas'
]

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop'

export default function BlogListClient({ initialPosts }: { initialPosts: BlogPostItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = useMemo(() => {
    return initialPosts.filter(post => {
      const matchCategory =
        selectedCategory === 'All' ||
        (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase())

      const matchSearch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchCategory && matchSearch
    })
  }, [initialPosts, selectedCategory, searchQuery])

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null
  const regularPosts = filteredPosts.length > 0 ? filteredPosts.slice(1) : []

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      {/* Category Pills & Search */}
      <div className='flex flex-col md:flex-row items-center justify-between gap-6 mb-12'>
        <div className='flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none'>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#006241] text-white shadow-md'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className='relative w-full md:w-72'>
          <input
            type='text'
            placeholder='Search spiritual articles...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006241]/30 focus:border-[#006241] text-sm text-slate-800'
          />
          <span className='absolute left-3.5 top-3 text-slate-400 text-sm'>🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 text-sm'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className='text-center py-20 bg-emerald-50/40 rounded-3xl border border-dashed border-emerald-200 my-8'>
          <div className='text-5xl mb-3'>🪔</div>
          <h3 className='text-2xl font-bold text-slate-800 mb-2'>No articles found</h3>
          <p className='text-slate-500 max-w-md mx-auto mb-6'>
            {searchQuery
              ? `No articles matched "${searchQuery}". Try different keywords or select another category.`
              : 'New spiritual insights and Vedic articles are arriving soon. Stay tuned!'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSelectedCategory('All')
                setSearchQuery('')
              }}
              className='px-6 py-2.5 bg-[#006241] text-white rounded-xl font-medium hover:bg-[#004e34] transition-colors'
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className='space-y-12'>
          {/* Featured Post */}
          {featuredPost && (
            <div className='group relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300'>
              <div className='grid grid-cols-1 lg:grid-cols-12 gap-0'>
                <div className='lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPost.featuredImage || DEFAULT_IMAGE}
                    alt={featuredPost.title}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700'
                  />
                  <div className='absolute top-4 left-4'>
                    <span className='px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-[#006241] shadow-sm backdrop-blur-sm'>
                      ⭐ Featured • {featuredPost.category || 'Vedic'}
                    </span>
                  </div>
                </div>

                <div className='lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between'>
                  <div>
                    <div className='flex items-center gap-3 text-xs text-slate-500 font-medium mb-3'>
                      <span>
                        {featuredPost.publishedAt
                          ? new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Recent'}
                      </span>
                      <span>•</span>
                      <span>⏳ {featuredPost.readTimeMinutes || 5} min read</span>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`}>
                      <h2 className='text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-[#006241] transition-colors line-clamp-2 leading-tight mb-4'>
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className='text-slate-600 text-sm sm:text-base line-clamp-3 leading-relaxed mb-6'>
                      {featuredPost.excerpt ||
                        featuredPost.content
                          .replace(/<[^>]*>/g, ' ')
                          .slice(0, 180) + '...'}
                    </p>
                  </div>

                  <div className='flex items-center justify-between pt-6 border-t border-slate-100'>
                    <div className='flex items-center gap-2.5'>
                      <div className='w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-sm'>
                        {featuredPost.authorName ? featuredPost.authorName.charAt(0) : 'M'}
                      </div>
                      <div>
                        <div className='text-xs font-bold text-slate-800'>
                          {featuredPost.authorName || 'Mandirsetuu Team'}
                        </div>
                        <div className='text-[11px] text-slate-400'>Spiritual Contributor</div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className='inline-flex items-center gap-1 text-sm font-bold text-[#006241] hover:underline'
                    >
                      Read Full Article &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Posts Grid */}
          {regularPosts.length > 0 && (
            <div>
              <h3 className='text-xl font-bold text-slate-800 mb-6 flex items-center gap-2'>
                <span>🪔</span> Latest Spiritual Insights
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                {regularPosts.map(post => (
                  <article
                    key={post.id}
                    className='group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1'
                  >
                    <div className='relative h-52 overflow-hidden'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.featuredImage || DEFAULT_IMAGE}
                        alt={post.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                      />
                      <div className='absolute top-3 left-3'>
                        <span className='px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/90 text-[#006241] shadow-sm backdrop-blur-sm'>
                          {post.category || 'Vedic'}
                        </span>
                      </div>
                    </div>

                    <div className='p-6 flex-1 flex flex-col justify-between'>
                      <div>
                        <div className='flex items-center gap-2 text-[12px] text-slate-400 font-medium mb-2.5'>
                          <span>
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Recent'}
                          </span>
                          <span>•</span>
                          <span>⏳ {post.readTimeMinutes || 5} min read</span>
                        </div>

                        <Link href={`/blog/${post.slug}`}>
                          <h4 className='text-lg font-bold text-slate-900 group-hover:text-[#006241] transition-colors line-clamp-2 leading-snug mb-2.5'>
                            {post.title}
                          </h4>
                        </Link>

                        <p className='text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4'>
                          {post.excerpt ||
                            post.content
                              .replace(/<[^>]*>/g, ' ')
                              .slice(0, 120) + '...'}
                        </p>
                      </div>

                      <div className='pt-4 border-t border-slate-100 flex items-center justify-between text-xs'>
                        <span className='text-slate-500 font-medium'>
                          By {post.authorName || 'Mandirsetuu Team'}
                        </span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className='font-bold text-[#006241] group-hover:underline'
                        >
                          Read &rarr;
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
