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
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type KundliType = Priced & {
  id: string
  title: string
  description: string
  delivery: string
  image: string
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

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-6xl mx-auto'>
        <Button component={Link} href='/front-pages/kundli' className='mb-6 font-semibold' style={{ color: '#006241' }}>
          &larr; Back to all Kundli types
        </Button>

        {/* 🌟 UI LAYOUT SPLIT TOP HERO: Image on Left, Content & Buy Box on Right */}
        <div className='galaxy-card overflow-hidden rounded-2xl p-6 mb-8' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>
            
            {/* LEFT SIDE: KUNDLI REPORT IMAGE */}
            <div className='md:col-span-5 space-y-4'>
              <div className='relative h-72 md:h-96 w-full rounded-xl overflow-hidden shadow-lg border border-emerald-500/20'>
                <img src={listing.image} alt={listing.title} className='w-full h-full object-cover' />
                <div className='absolute bottom-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                  {listing.delivery}
                </div>
              </div>
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
        <div className='space-y-8'>
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

          <ReviewsSection orderType='KUNDLI' targetId={listing.id} />
        </div>
      </div>
    </div>
  )
}

export default KundliDetailPage
