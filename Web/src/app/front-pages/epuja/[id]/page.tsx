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

export default function EpujaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<PujaListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')

  useEffect(() => {
    if (!id) return

    fetch(`/api/epuja/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setListing(data)
        setSelectedImage(data.image)
        if (data.packages && data.packages.length > 0) {
          setSelectedPackageId(data.packages[0].id)
        }
      })
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
          <Alert severity='error'>This E-Puja listing could not be found.</Alert>
          <Button component={Link} href='/front-pages/epuja' className='mt-4 font-bold text-amber-400'>
            &larr; Back to all E-Pujas
          </Button>
        </div>
      </div>
    )
  }

  const benefitLines = (listing.benefits || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const galleryImages = [
    { type: 'image' as const, url: listing.image, title: listing.title },
    ...(listing.media || [])
  ]

  const hasTempleInfo = Boolean(listing.templeName || listing.templeLocation || listing.significance)
  const secondaryTabLabel = listing.secondaryTabLabel || 'Temple Details'

  const cheapestPackage = listing.packages.length > 0
    ? listing.packages.reduce((min, pkg) => (effectivePrice(pkg) < effectivePrice(min) ? pkg : min), listing.packages[0])
    : null

  const activePackage = listing.packages.find(p => p.id === selectedPackageId) || cheapestPackage

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto space-y-12'>
        
        {/* Breadcrumb Navigation */}
        <div className='flex items-center gap-2 text-sm text-slate-400'>
          <Link href='/front-pages/epuja' className='hover:text-amber-400 transition-colors'>
            E-Pujas
          </Link>
          <span>/</span>
          <span className='text-amber-400 font-semibold'>{listing.category}</span>
          <span>/</span>
          <span className='text-slate-200 font-medium truncate max-w-xs'>{listing.title}</span>
        </div>

        {/* 🌟 GEMS MANTRA SPLIT TOP HERO SECTION (Image Left, Package & Booking Box Right) */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'>
          
          {/* LEFT COLUMN: PUJA HERO IMAGE & GALLERY & TRUST BADGES */}
          <div className='lg:col-span-6 space-y-6'>
            <div className='galaxy-card p-4 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden group'>
              {listing.templeName && (
                <div className='absolute top-6 left-6 z-10 bg-amber-950/80 backdrop-blur-md text-amber-300 font-semibold text-xs px-3.5 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5'>
                  <span>🛕</span> {listing.templeName}
                </div>
              )}

              <div className='relative h-80 sm:h-[420px] w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center'>
                <img
                  src={selectedImage || listing.image}
                  alt={listing.title}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                />
              </div>

              {/* Gallery Thumbnails */}
              {galleryImages.length > 1 && (
                <div className='flex items-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-none'>
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        (selectedImage || listing.image) === img.url
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                          : 'border-slate-800 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt='' className='w-full h-full object-cover' />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sacred Guarantee Badges under Left Image */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-amber-500/10 backdrop-blur-md text-center text-xs'>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>📜</div>
                <div className='font-bold text-slate-200'>Agama Shastra</div>
                <div className='text-slate-400 text-[10px]'>Vedic Vidhi</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🙏</div>
                <div className='font-bold text-slate-200'>Personal Sankalp</div>
                <div className='text-slate-400 text-[10px]'>Name & Gotra</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>📽️</div>
                <div className='font-bold text-slate-200'>HD Video Link</div>
                <div className='text-slate-400 text-[10px]'>Proof Video</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>📦</div>
                <div className='font-bold text-slate-200'>Blessed Prasad</div>
                <div className='text-slate-400 text-[10px]'>Home Delivery</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PUJA TITLE, PRICING, PACKAGE SELECTOR & BOOKING CTA */}
          <div className='lg:col-span-6 space-y-6'>
            <div>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3'>
                <span>🪔</span> Online Temple E-Puja Service
              </div>
              <h1 className='text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight tracking-tight mb-3'>
                {listing.title}
              </h1>

              {/* Rating & Reviews Bar */}
              <div className='flex items-center gap-3 text-sm mb-4'>
                <div className='flex items-center text-amber-400 font-bold'>
                  ★★★★★ <span className='ml-1 text-slate-200'>4.95</span>
                </div>
                <span className='text-slate-600'>|</span>
                <span className='text-amber-400 font-medium cursor-pointer hover:underline'>
                  180+ Devotee Sankalps Conducted
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className='p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl space-y-2'>
              <div className='text-xs font-bold text-amber-400 uppercase tracking-wider'>
                Cheapest Package Starting From
              </div>
              <div className='flex items-baseline gap-3'>
                <span className='text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500'>
                  ₹{activePackage ? effectivePrice(activePackage) : cheapestPackage ? effectivePrice(cheapestPackage) : 0}
                </span>
                {activePackage && hasOfferDiscount(activePackage) && (
                  <span className='text-lg text-slate-400 line-through font-semibold'>
                    ₹{activePackage.price}
                  </span>
                )}
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                {activePackage ? gstLabel(activePackage) : 'Includes Pandit Dakshina, Puja Samagri & Prasad Shipping'}
              </div>
            </div>

            {/* Package Selector Cards (Single / Couple / Family) */}
            {listing.packages.length > 0 && (
              <div className='space-y-3'>
                <div className='text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between'>
                  <span>Select Puja Package</span>
                  <span className='text-amber-400 font-normal'>Choose Devotee Option</span>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  {listing.packages.map(pkg => {
                    const isSelected = selectedPackageId === pkg.id
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className='font-bold text-slate-200 text-sm mb-1'>{pkg.type}</div>
                        <div className='text-amber-300 font-black text-base'>₹{effectivePrice(pkg)}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Temple Location Summary */}
            {listing.templeName && (
              <div className='p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 text-sm space-y-1'>
                <div>
                  <strong className='text-amber-400'>Temple Shrine:</strong> {listing.templeName}
                </div>
                {listing.templeLocation && (
                  <div className='text-xs text-slate-400'>
                    📍 {listing.templeLocation}
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <div className='pt-2'>
              <Button
                fullWidth
                component={Link}
                href={`/front-pages/epuja?book=${listing.id}${activePackage ? `&package=${activePackage.id}` : ''}`}
                variant='contained'
                size='large'
                className='py-4 font-extrabold text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all'
              >
                🪔 Book E-Puja & Submit Sankalp
              </Button>
            </div>

          </div>

        </div>

        {/* 📜 FULL BODY WIDTH SECTION (After Image & Package Selection Finishes) */}
        <div className='pt-8 border-t border-amber-500/20 space-y-12'>
          
          {/* Detail Tabs */}
          <div className='galaxy-card p-6 md:p-8 rounded-3xl border border-amber-500/20 shadow-xl'>
            <DetailPageTabs
              tabs={[
                {
                  key: 'about',
                  label: 'About E-Puja',
                  content: (
                    <div className='space-y-4 text-slate-300 leading-relaxed'>
                      <Typography className='text-base leading-relaxed' style={{ color: '#d1d5db' }}>
                        {listing.description}
                      </Typography>
                      <div className='p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300'>
                        ℹ️ Name, Gotra & wishes submitted during booking are recited by Vedic Priests during live Sankalp.
                      </div>
                    </div>
                  )
                },
                {
                  key: 'temple',
                  label: secondaryTabLabel,
                  hidden: !hasTempleInfo,
                  content: (
                    <div className='space-y-3 text-slate-300'>
                      {listing.templeName && (
                        <div>
                          <strong className='text-amber-400'>Sacred Temple Shrine:</strong> {listing.templeName}
                        </div>
                      )}
                      {listing.templeLocation && (
                        <div>
                          <strong className='text-amber-400'>Holy Location:</strong> {listing.templeLocation}
                        </div>
                      )}
                      {listing.significance && (
                        <div className='leading-relaxed pt-2 text-slate-300'>
                          {listing.significance}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'benefits',
                  label: 'Benefits',
                  hidden: benefitLines.length === 0,
                  content: (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {benefitLines.map((benefit, idx) => (
                        <div key={idx} className='flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800'>
                          <span className='text-amber-400 font-bold text-lg'>✓</span>
                          <span className='text-slate-200 text-sm'>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  key: 'process',
                  label: 'How It Works',
                  content: <HowItWorksSection page='epuja' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How E-Puja Works' />
                }
              ]}
            />
          </div>

          {/* Service FAQ Section */}
          <ServiceFaq items={[]} />

          {/* Devotee Reviews */}
          <ReviewsSection orderType='EPUJA' targetId={listing.id} />

          {/* Related E-Pujas */}
          <RelatedListings
            fetchUrl='/api/epuja/listings'
            currentId={listing.id}
            basePath='/front-pages/epuja'
            mapItem={(item: any) => ({
              id: item.id,
              title: item.title,
              price: effectivePrice(item.packages?.[0] || item),
              image: item.image
            })}
          />

        </div>

      </div>
    </div>
  )
}
