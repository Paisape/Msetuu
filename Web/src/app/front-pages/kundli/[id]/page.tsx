'use client'

import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'
import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import ReviewsSection from '@/components/ReviewsSection'
import RelatedListings from '@/components/RelatedListings'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import ServiceFaq from '@/components/ServiceFaq'
import DetailPageTabs from '@/components/DetailPageTabs'
import MediaCarousel, { type MediaGalleryItem } from '@/components/MediaCarousel'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type KundliType = Priced & {
  id: string
  title: string
  description: string
  delivery: string
  image: string
  significance?: string | null
  benefits?: string | null
  secondaryTabLabel?: string | null
  media?: MediaGalleryItem[] | null
}

const KundliDetailPage = () => {
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
      <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6 flex justify-center'>
        <CircularProgress />
      </div>
    )
  }

  if (notFound || !listing) {
    return (
      <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
        <div className='max-w-3xl mx-auto'>
          <Alert severity='error'>This Kundli type could not be found.</Alert>
          <Button component={Link} href='/front-pages/kundli' className='mt-4 font-bold' style={{ color: '#006241' }}>
            &larr; Back to all Kundli types
          </Button>
        </div>
      </div>
    )
  }

  // Benefits are stored as one line per benefit — split + drop blank lines for display.
  const benefitLines = (listing.benefits || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const secondaryTabLabel = listing.secondaryTabLabel || 'Details'

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-6xl mx-auto'>
        <Button component={Link} href='/front-pages/kundli' className='mb-6 font-semibold' style={{ color: '#006241' }}>
          &larr; Back to all Kundli types
        </Button>

        {/* 🌟 UI LAYOUT SPLIT TOP HERO: Image on Left, Content & Buy Box on Right */}
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 mb-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>

            {/* LEFT SIDE: KUNDLI REPORT IMAGE & MEDIA CAROUSEL */}
            <div className='md:col-span-5 space-y-4'>
              <div className='relative h-72 md:h-96 w-full rounded-xl overflow-hidden shadow-lg border border-emerald-500/20'>
                <img src={listing.image} alt={listing.title} className='w-full h-full object-cover' />
                <div className='absolute bottom-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                  {listing.delivery}
                </div>
              </div>
              <MediaCarousel media={listing.media} title='More Glimpses' />
            </div>

            {/* RIGHT SIDE: TITLE, DESCRIPTION, PRICE & BOOK NOW CTA */}
            <div className='md:col-span-7 flex flex-col justify-between h-full space-y-6'>
              <div>
                <Typography variant='h3' className='font-bold mb-3' style={{ color: '#047857', fontFamily: 'Cinzel, Georgia, serif' }}>
                  {listing.title}
                </Typography>
                <Typography className='leading-relaxed text-sm md:text-base' style={{ color: '#374151' }}>
                  {listing.description}
                </Typography>
              </div>

              {/* Price & Buy Block */}
              <Box className='cta-highlight-bar p-5 rounded-xl space-y-4' style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.06)' }}>
                <div>
                  <Typography variant='h4' className='font-bold' style={{ color: '#006241' }}>
                    {hasOfferDiscount(listing) && (
                      <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.85em' }}>
                        ₹{listing.price}
                      </span>
                    )}
                    ₹{effectivePrice(listing)}
                  </Typography>
                  {gstLabel(listing) && (
                    <Typography variant='caption' style={{ color: '#6b7280' }}>
                      {gstLabel(listing)}
                    </Typography>
                  )}
                </div>
                <Button
                  component={Link}
                  href={`/front-pages/kundli?book=${listing.id}`}
                  size='large'
                  className='galaxy-glow-btn cta-pulse-btn font-bold px-10 py-3'
                >
                  Book Now
                </Button>
              </Box>
            </div>

          </div>
        </div>

        {/* 📜 FULL BODY WIDTH CONTAINER (Below Image & Top Split Area) */}
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 md:p-8 mb-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <DetailPageTabs
            tabs={[
              {
                key: 'about',
                label: 'About This Report',
                content: (
                  <>
                    <Typography className='leading-relaxed mb-4' style={{ color: '#374151' }}>
                      {listing.description}
                    </Typography>
                    <Typography variant='body2' style={{ color: '#6b7280' }}>
                      Delivery: {listing.delivery}
                    </Typography>
                  </>
                )
              },
              {
                key: 'details',
                label: secondaryTabLabel,
                hidden: !listing.significance,
                content: (
                  <Typography variant='body2' className='leading-relaxed' style={{ color: '#4b5563' }}>
                    {listing.significance}
                  </Typography>
                )
              },
              {
                key: 'benefits',
                label: 'Benefits',
                hidden: benefitLines.length === 0,
                content: (
                  <div className='flex flex-col gap-2'>
                    {benefitLines.map((benefit, idx) => (
                      <div key={idx} className='flex items-start gap-2'>
                        <span style={{ color: '#006241', fontWeight: 700, lineHeight: '1.4' }}>✓</span>
                        <Typography variant='body2' style={{ color: '#374151' }}>{benefit}</Typography>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                key: 'process',
                label: 'Process',
                content: <HowItWorksSection page='kundli' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How Booking Works' />
              },
              {
                key: 'pricing',
                label: 'Pricing',
                content: (
                  <Box className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div>
                      <Typography variant='h5' className='font-bold' style={{ color: '#006241' }}>
                        {hasOfferDiscount(listing) && (
                          <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.85em' }}>
                            ₹{listing.price}
                          </span>
                        )}
                        ₹{effectivePrice(listing)}
                      </Typography>
                      {gstLabel(listing) && (
                        <Typography variant='caption' style={{ color: '#6b7280' }}>
                          {gstLabel(listing)}
                        </Typography>
                      )}
                    </div>
                    <Button
                      component={Link}
                      href={`/front-pages/kundli?book=${listing.id}`}
                      className='galaxy-glow-btn font-bold px-8'
                    >
                      Book Now
                    </Button>
                  </Box>
                )
              },
              {
                key: 'reviews',
                label: 'Reviews',
                content: <ReviewsSection orderType='KUNDLI' targetId={listing.id} />
              },
              {
                key: 'faqs',
                label: 'FAQs',
                content: (
                  <ServiceFaq
                    page='kundli'
                    listingId={listing.id}
                    title='Frequently Asked Questions'
                    items={[
                      {
                        question: 'How long does it take to receive my Kundli?',
                        answer: 'Physical copies are dispatched within 3-5 working days; PDF scans are shared to your email within 24-48 hours of order confirmation.'
                      },
                      {
                        question: 'What details do I need to provide?',
                        answer: 'Accurate date, time, and place of birth are required for an accurate horoscope — double-check these before submitting your order.'
                      },
                      {
                        question: 'Can I track my delivery?',
                        answer: 'Yes, once dispatched, a courier tracking number is shared with you and visible on your My Orders page.'
                      }
                    ]}
                  />
                )
              }
            ]}
          />
        </div>

        <RelatedListings
          fetchUrl='/api/kundli/listings'
          currentId={listing.id}
          basePath='/front-pages/kundli'
          title='Other Kundli Reports You May Like'
          mapItem={(raw: any) => ({
            id: raw.id,
            title: raw.title,
            image: raw.image,
            price: raw.price,
            offerPrice: raw.offerPrice,
            gstPercentage: raw.gstPercentage,
            gstInclusive: raw.gstInclusive
          })}
        />
      </div>
    </div>
  )
}

export default KundliDetailPage
