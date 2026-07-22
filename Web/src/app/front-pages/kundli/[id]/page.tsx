'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import ReviewsSection from '@/components/ReviewsSection'
import RelatedListings from '@/components/RelatedListings'
import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import DetailPageTabs from '@/components/DetailPageTabs'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type KundliType = Priced & {
  id: string
  title: string
  description: string
  delivery: string
  image: string
  pages?: number | null
}

export default function KundliDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<KundliType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/kundli/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => setListing(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6 flex items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  if (notFound || !listing) {
    return (
      <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
        <div className='max-w-3xl mx-auto'>
          <Alert severity='error'>This Kundli report type could not be found.</Alert>
          <Button component={Link} href='/front-pages/kundli' className='mt-4 font-bold text-amber-400'>
            &larr; Back to Kundli Reports
          </Button>
        </div>
      </div>
    )
  }

  const discountPercent = hasOfferDiscount(listing)
    ? Math.round(((listing.price - listing.offerPrice!) / listing.price) * 100)
    : 0

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto space-y-12'>
        
        {/* Breadcrumb Navigation */}
        <div className='flex items-center gap-2 text-sm text-slate-400'>
          <Link href='/front-pages/kundli' className='hover:text-amber-400 transition-colors'>
            Kundli
          </Link>
          <span>/</span>
          <span className='text-amber-400 font-semibold'>Vedic Astrology Reports</span>
          <span>/</span>
          <span className='text-slate-200 font-medium truncate max-w-xs'>{listing.title}</span>
        </div>

        {/* 🌟 GEMS MANTRA SPLIT TOP HERO SECTION (Image Left, Purchase Box Right) */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'>
          
          {/* LEFT SIDE: KUNDLI CHART / REPORT IMAGE & TRUST GUARANTEES */}
          <div className='lg:col-span-6 space-y-6'>
            <div className='galaxy-card p-4 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden group'>
              {discountPercent > 0 && (
                <div className='absolute top-6 left-6 z-10 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider'>
                  {discountPercent}% OFF
                </div>
              )}
              <div className='absolute top-6 right-6 z-10 bg-amber-950/80 backdrop-blur-md text-amber-300 font-semibold text-xs px-3.5 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5'>
                <span>📑</span> {listing.delivery}
              </div>

              <div className='relative h-80 sm:h-[420px] w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center'>
                <img
                  src={listing.image}
                  alt={listing.title}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                />
              </div>
            </div>

            {/* Trust Badges */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-amber-500/10 backdrop-blur-md text-center text-xs'>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🔯</div>
                <div className='font-bold text-slate-200'>Vedic Accuracy</div>
                <div className='text-slate-400 text-[10px]'>Parashara Shastra</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>📄</div>
                <div className='font-bold text-slate-200'>PDF & Print</div>
                <div className='text-slate-400 text-[10px]'>Instant Download</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🔮</div>
                <div className='font-bold text-slate-200'>Dasha & Remedy</div>
                <div className='text-slate-400 text-[10px]'>Full Predictions</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🔒</div>
                <div className='font-bold text-slate-200'>100% Private</div>
                <div className='text-slate-400 text-[10px]'>Confidential</div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: KUNDLI DETAILS, PRICING & ORDER CTA */}
          <div className='lg:col-span-6 space-y-6'>
            <div>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3'>
                <span>🔯</span> Premium Vedic Kundli Report
              </div>
              <h1 className='text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight tracking-tight mb-3'>
                {listing.title}
              </h1>

              {/* Rating Bar */}
              <div className='flex items-center gap-3 text-sm mb-4'>
                <div className='flex items-center text-amber-400 font-bold'>
                  ★★★★★ <span className='ml-1 text-slate-200'>4.96</span>
                </div>
                <span className='text-slate-600'>|</span>
                <span className='text-amber-400 font-medium cursor-pointer hover:underline'>
                  340+ Generated Reports
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className='p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl space-y-2'>
              <div className='flex items-baseline gap-3'>
                <span className='text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500'>
                  ₹{effectivePrice(listing)}
                </span>
                {hasOfferDiscount(listing) && (
                  <span className='text-lg text-slate-400 line-through font-semibold'>
                    ₹{listing.price}
                  </span>
                )}
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                {gstLabel(listing) || 'Includes Complete Horoscope Analysis, Remedies & PDF Delivery'}
              </div>
            </div>

            {/* Quick Specs */}
            <div className='grid grid-cols-2 gap-3 text-xs'>
              <div className='p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300'>
                <strong className='text-amber-400 block mb-0.5'>Format:</strong> {listing.delivery}
              </div>
              <div className='p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300'>
                <strong className='text-amber-400 block mb-0.5'>Scope:</strong> Full Life & Dasha Analysis
              </div>
            </div>

            {/* Action CTA */}
            <div className='pt-2'>
              <Button
                fullWidth
                component={Link}
                href={`/front-pages/kundli?type=${listing.id}`}
                variant='contained'
                size='large'
                className='py-4 font-extrabold text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all'
              >
                🔯 Generate Kundli Report & Submit Birth Details
              </Button>
            </div>

          </div>

        </div>

        {/* 📜 FULL BODY WIDTH SECTION (After Image Area Finishes) */}
        <div className='pt-8 border-t border-amber-500/20 space-y-12'>
          
          {/* Detail Tabs */}
          <div className='galaxy-card p-6 md:p-8 rounded-3xl border border-amber-500/20 shadow-xl'>
            <DetailPageTabs
              tabs={[
                {
                  key: 'about',
                  label: 'Report Details',
                  content: (
                    <div className='space-y-4 text-slate-300 leading-relaxed'>
                      <Typography className='text-base leading-relaxed' style={{ color: '#d1d5db' }}>
                        {listing.description}
                      </Typography>
                      <div className='p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300'>
                        ℹ️ Computed strictly using high-precision Vedic NASA Ephemeris astronomical tables and Parashara Kundli mathematics.
                      </div>
                    </div>
                  )
                },
                {
                  key: 'process',
                  label: 'How It Works',
                  content: <HowItWorksSection page='kundli' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How Kundli Generation Works' />
                }
              ]}
            />
          </div>

          {/* FAQs Section */}
          <ServiceFaq items={[]} />

          {/* Customer Reviews */}
          <ReviewsSection orderType='KUNDLI' targetId={listing.id} />

          {/* Related Listings */}
          <RelatedListings
            fetchUrl='/api/kundli/listings'
            currentId={listing.id}
            basePath='/front-pages/kundli'
            mapItem={(item: any) => ({
              id: item.id,
              title: item.title,
              price: effectivePrice(item),
              offerPrice: item.offerPrice,
              image: item.image
            })}
          />

        </div>

      </div>
    </div>
  )
}
