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
import { effectivePrice, hasOfferDiscount, gstLabel } from '@/libs/pricing'

type ChadhavaListing = {
  id: string
  title: string
  description: string
  location: string | null
  image: string
  price: number
  offerPrice?: number | null
  gstPercentage?: number | null
  gstInclusive?: boolean
  significance?: string | null
  benefits?: string | null
  secondaryTabLabel?: string | null
  media?: MediaGalleryItem[] | null
}

const ChadhavaDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<ChadhavaListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/chadhava/listings/${id}`)
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
          <Alert severity='error'>This Chadhava offering could not be found.</Alert>
          <Button component={Link} href='/front-pages/chadhava' className='mt-4 font-bold' style={{ color: '#006241' }}>
            &larr; Back to all Chadhava offerings
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

  const hasTempleInfo = Boolean(listing.location || listing.significance)
  const secondaryTabLabel = listing.secondaryTabLabel || 'Temple Details'

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-6xl mx-auto'>
        <Button component={Link} href='/front-pages/chadhava' className='mb-6 font-semibold' style={{ color: '#006241' }}>
          &larr; Back to all Chadhava offerings
        </Button>

        {/* 🌟 UI LAYOUT SPLIT TOP HERO: Image on Left, Content & Buy Box on Right */}
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 mb-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>
            
            {/* LEFT SIDE: HERO OFFERING IMAGE & MEDIA CAROUSEL */}
            <div className='md:col-span-5 space-y-4'>
              <div className='relative h-72 md:h-96 w-full rounded-xl overflow-hidden shadow-lg border border-emerald-500/20'>
                <img src={listing.image} alt={listing.title} className='w-full h-full object-cover' />
                {listing.location && (
                  <div className='absolute top-3 right-3 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                    📍 {listing.location}
                  </div>
                )}
              </div>
              <MediaCarousel media={listing.media} title='More Glimpses' />
            </div>

            {/* RIGHT SIDE: TITLE, LOCATION, PRICE & BOOK NOW CTA */}
            <div className='md:col-span-7 flex flex-col justify-between h-full space-y-6'>
              <div>
                <Typography variant='h3' className='font-bold' style={{ color: '#ffffff', fontFamily: 'Cinzel, Georgia, serif' }}>
                  {listing.title}
                </Typography>

                {listing.location && (
                  <Typography variant='subtitle1' className='font-semibold mt-2' style={{ color: '#a7f3d0' }}>
                    📍 Sacred Shrine Location: {listing.location}
                  </Typography>
                )}
              </div>

              {/* Price & Buy Block */}
              <Box className='cta-highlight-bar p-5 rounded-xl space-y-4' style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.06)' }}>
                <div>
                  <Typography variant='h4' className='font-bold' style={{ color: '#006241' }}>
                    {hasOfferDiscount(listing) && (
                      <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.7em' }}>
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
                  href={`/front-pages/chadhava?book=${listing.id}`}
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
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 md:p-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <DetailPageTabs
            tabs={[
              {
                key: 'about',
                label: 'About Offering',
                content: (
                  <>
                    <Typography className='leading-relaxed mb-4' style={{ color: '#374151' }}>
                      {listing.description}
                    </Typography>
                    <Typography variant='body2' style={{ color: '#6b7280' }}>
                      Includes direct temple offering, personalized gotra chanting, Prasad delivery, and video proof.
                    </Typography>
                  </>
                )
              },
              {
                key: 'temple',
                label: secondaryTabLabel,
                hidden: !hasTempleInfo,
                content: (
                  <div className='flex flex-col gap-2'>
                    {listing.location && (
                      <Typography variant='body2' style={{ color: '#4b5563' }}>
                        <strong style={{ color: '#374151' }}>Location:</strong> {listing.location}
                      </Typography>
                    )}
                    {listing.significance && (
                      <Typography variant='body2' className='leading-relaxed mt-1' style={{ color: '#4b5563' }}>
                        {listing.significance}
                      </Typography>
                    )}
                  </div>
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
                content: <HowItWorksSection page='chadhava' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How Booking Works' />
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
                      href={`/front-pages/chadhava?book=${listing.id}`}
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
                content: <ReviewsSection orderType='CHADHAVA' targetId={listing.id} />
              },
              {
                key: 'faqs',
                label: 'FAQs',
                content: (
                  <ServiceFaq
                    page='chadhava'
                    title='Frequently Asked Questions'
                    items={[
                      {
                        question: 'How do I know the Chadhava has been offered?',
                        answer:
                          "You will receive a personalized video clip of the Pandit chanting your name and gotra while making the offering at the deity's shrine. This is uploaded directly to your admin dashboard within 24-48 hours."
                      },
                      {
                        question: 'How long does it take for Prasad to be delivered?',
                        answer:
                          'The physical Prasad is packed sanitarily and dispatched within 24 hours of the ritual. It typically reaches your address in 3 to 5 working days depending on your location.'
                      },
                      {
                        question: 'Can I offer Chadhava on a specific date or festival?',
                        answer:
                          'Yes, when configuring your booking, you can select special dates like Amavasya, Purnima, Ekadashi, or local temple festivals to align your offering with auspicious timings.'
                      },
                      {
                        question: 'What items are included in the Chadhava package?',
                        answer:
                          "Each package contains standard bhog (sweets/dry fruits), flowers, sacred threads, and a protective tilak. The specific details vary depending on the temple's tradition."
                      }
                    ]}
                  />
                )
              }
            ]}
          />
        </div>

        <RelatedListings
          fetchUrl='/api/chadhava/listings'
          currentId={listing.id}
          basePath='/front-pages/chadhava'
          title='Other Sacred Offerings You May Like'
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

export default ChadhavaDetailPage
