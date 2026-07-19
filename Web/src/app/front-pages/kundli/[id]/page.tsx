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
          <Button component={Link} href='/front-pages/kundli' className='mt-4 font-bold' style={{ color: '#059669' }}>
            &larr; Back to all Kundli types
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-4xl mx-auto'>
        <Button component={Link} href='/front-pages/kundli' className='mb-6 font-semibold' style={{ color: '#059669' }}>
          &larr; Back to all Kundli types
        </Button>

        <div className='galaxy-card overflow-hidden rounded-2xl' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className='relative h-72 md:h-96 w-full overflow-hidden'>
            <img src={listing.image} alt={listing.title} className='w-full h-full object-cover' />
            <div className='absolute bottom-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
              {listing.delivery}
            </div>
          </div>

          <Box className='p-6 md:p-8'>
            <Typography variant='h4' className='font-bold mb-3' style={{ color: '#047857' }}>
              {listing.title}
            </Typography>
            <Typography className='leading-relaxed mb-6' style={{ color: '#374151' }}>
              {listing.description}
            </Typography>

            <Box className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div>
                <Typography variant='h5' className='font-bold' style={{ color: '#059669' }}>
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
                className='galaxy-glow-btn cta-pulse-btn font-bold px-10'
              >
                Book Now
              </Button>
            </Box>
          </Box>
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

        <ReviewsSection orderType='KUNDLI' targetId={listing.id} />
      </div>
    </div>
  )
}

export default KundliDetailPage
