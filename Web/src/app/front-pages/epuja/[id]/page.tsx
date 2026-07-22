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

type PujaPackage = Priced & {
  id: string
  type: string
}

type PujaListing = {
  id: string
  title: string
  description: string
  image: string
  category: string
  packages: PujaPackage[]
  templeName?: string | null
  templeLocation?: string | null
  significance?: string | null
  benefits?: string | null
  secondaryTabLabel?: string | null
  media?: MediaGalleryItem[] | null
}

const EpujaDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<PujaListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/epuja/listings/${id}`)
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
          <Alert severity='error'>This E-Puja could not be found.</Alert>
          <Button component={Link} href='/front-pages/epuja' className='mt-4 font-bold' style={{ color: '#006241' }}>
            &larr; Back to all E-Pujas
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

  const hasTempleInfo = Boolean(listing.templeName || listing.templeLocation || listing.significance)
  const secondaryTabLabel = listing.secondaryTabLabel || 'Temple Details'

  // Packages are priced individually (Single/Couple/Family) — show the lowest as a "starting
  // from" price in the persistent CTA bar, same idea as the per-package prices in the Packages tab.
  const cheapestPackage = listing.packages.length > 0
    ? listing.packages.reduce((min, pkg) => (effectivePrice(pkg) < effectivePrice(min) ? pkg : min), listing.packages[0])
    : null

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-6xl mx-auto'>
        <Button component={Link} href='/front-pages/epuja' className='mb-6 font-semibold' style={{ color: '#006241' }}>
          &larr; Back to all E-Pujas
        </Button>

        {/* 🌟 UI LAYOUT SPLIT TOP HERO: Image on Left, Content & Buy Box on Right */}
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 mb-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>
            
            {/* LEFT SIDE: HERO PUJA IMAGE & MEDIA CAROUSEL */}
            <div className='md:col-span-5 space-y-4'>
              <div className='relative h-72 md:h-96 w-full rounded-xl overflow-hidden shadow-lg border border-emerald-500/20'>
                <img src={listing.image} alt={listing.title} className='w-full h-full object-cover' />
                {listing.category && (
                  <div className='absolute top-3 right-3 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                    {listing.category}
                  </div>
                )}
              </div>
              <MediaCarousel media={listing.media} title='More Glimpses' />
            </div>

            {/* RIGHT SIDE: TITLE, TEMPLE INFO, PRICE & ACTION CTAs */}
            <div className='md:col-span-7 flex flex-col justify-between h-full space-y-6'>
              <div>
                <Typography variant='h3' className='font-bold' style={{ color: '#ffffff', fontFamily: 'Cinzel, Georgia, serif' }}>
                  {listing.title}
                </Typography>

                {listing.templeName && (
                  <Typography variant='subtitle1' className='font-semibold mt-2' style={{ color: '#a7f3d0' }}>
                    🛕 {listing.templeName} {listing.templeLocation ? `(${listing.templeLocation})` : ''}
                  </Typography>
                )}
              </div>

              {/* Price & Buy Block */}
              {cheapestPackage && (
                <Box className='cta-highlight-bar p-5 rounded-xl space-y-4' style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.06)' }}>
                  <div>
                    <Typography variant='body2' className='text-xs font-semibold uppercase tracking-wider mb-1' style={{ color: '#006241' }}>
                      Starting From
                    </Typography>
                    <Typography variant='h4' className='font-bold' style={{ color: '#006241' }}>
                      {hasOfferDiscount(cheapestPackage) && (
                        <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.7em' }}>
                          ₹{cheapestPackage.price}
                        </span>
                      )}
                      ₹{effectivePrice(cheapestPackage)}
                    </Typography>
                    {gstLabel(cheapestPackage) && (
                      <Typography variant='caption' style={{ color: '#6b7280' }}>
                        {gstLabel(cheapestPackage)}
                      </Typography>
                    )}
                  </div>
                  <Button
                    component={Link}
                    href={`/front-pages/epuja?book=${listing.id}`}
                    size='large'
                    className='galaxy-glow-btn cta-pulse-btn font-bold px-10 py-3'
                  >
                    Configure & Buy
                  </Button>
                </Box>
              )}
            </div>

          </div>
        </div>

        {/* 📜 FULL BODY WIDTH CONTAINER (Below Image & Top Split Area) */}
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 md:p-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <DetailPageTabs
            tabs={[
              {
                key: 'about',
                label: 'About Puja',
                content: (
                  <Typography className='leading-relaxed' style={{ color: '#374151' }}>
                    {listing.description}
                  </Typography>
                )
              },
              {
                key: 'temple',
                label: secondaryTabLabel,
                hidden: !hasTempleInfo,
                content: (
                  <div className='flex flex-col gap-2'>
                    {listing.templeName && (
                      <Typography variant='body2' style={{ color: '#4b5563' }}>
                        <strong style={{ color: '#374151' }}>Temple:</strong> {listing.templeName}
                      </Typography>
                    )}
                    {listing.templeLocation && (
                      <Typography variant='body2' style={{ color: '#4b5563' }}>
                        <strong style={{ color: '#374151' }}>Location:</strong> {listing.templeLocation}
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
                content: <HowItWorksSection page='epuja' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How Booking Works' />
              },
              {
                key: 'packages',
                label: 'Packages',
                content: (
                  <>
                    <div className='flex flex-col gap-2 text-sm' style={{ color: '#4b5563' }}>
                      {listing.packages.map(pkg => {
                        const icon = pkg.type === 'Single' ? '👤' : pkg.type === 'Couple' ? '👥' : '👨‍👩‍👧'

                        return (
                          <div key={pkg.id} className='p-3 rounded-lg' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                            {icon} {pkg.type}:{' '}
                            <strong style={{ color: '#006241' }}>
                              {hasOfferDiscount(pkg) && (
                                <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 4 }}>₹{pkg.price}</span>
                              )}
                              ₹{effectivePrice(pkg)}
                            </strong>
                            {gstLabel(pkg) && <span className='ml-1 text-xs' style={{ color: '#6b7280' }}>({gstLabel(pkg)})</span>}
                          </div>
                        )
                      })}
                    </div>
                    <Box className='flex justify-end mt-4'>
                      <Button
                        component={Link}
                        href={`/front-pages/epuja?book=${listing.id}`}
                        className='galaxy-glow-btn font-bold px-8'
                      >
                        Configure & Buy
                      </Button>
                    </Box>
                  </>
                )
              },
              {
                key: 'reviews',
                label: 'Reviews',
                content: <ReviewsSection orderType='EPUJA' targetId={listing.id} />
              },
              {
                key: 'faqs',
                label: 'FAQs',
                content: (
                  <ServiceFaq
                    page='epuja'
                    title='Frequently Asked Questions'
                    items={[
                      {
                        question: 'Do I need to be online during the Puja?',
                        answer:
                          'No, you do not need to be online. The pandits perform the Puja on your behalf chanting your name and gotra. However, you can join the live streaming or watch the recorded session later via your dashboard.'
                      },
                      {
                        question: 'What details are required to book an E-Puja?',
                        answer:
                          "To book a Puja, we require the primary devotee's Name, Gender, Date of Birth, Birth Place (for horoscope mapping), and Gotra or family members' names (for sankalp/resolution chanting)."
                      },
                      {
                        question: 'Is Prasad sent after the E-Puja is completed?',
                        answer:
                          'Yes! A package containing energized dry fruits Prasad, threads, tilak, and local temple blessings is dispatched to your shipping address and reaches you in 3-5 business days.'
                        },
                      {
                        question: 'Who performs these online Pujas?',
                        answer:
                          'All Pujas are conducted by qualified, certified Vedic pandits and shastris at prominent historical temple complexes in major spiritual cities like Kashi, Kedarnath, and Ujjain.'
                      }
                    ]}
                  />
                )
              }
            ]}
          />
        </div>

        <RelatedListings
          fetchUrl='/api/epuja/listings'
          currentId={listing.id}
          basePath='/front-pages/epuja'
          title='Other E-Pujas You May Like'
          mapItem={(raw: any) => ({
            id: raw.id,
            title: raw.title,
            image: raw.image,
            price: raw.price,
            offerPrice: raw.packages?.[0]?.offerPrice ?? null,
            gstPercentage: raw.packages?.[0]?.gstPercentage,
            gstInclusive: raw.packages?.[0]?.gstInclusive
          })}
        />
      </div>
    </div>
  )
}

export default EpujaDetailPage
