'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

import { effectivePrice, hasOfferDiscount } from '@/libs/pricing'

// Fallback used only if the database has no Chadhava listings yet (e.g. before seeding). No
// `id` here — "View Details" falls back to the listing page for these since there's no real
// detail page to link to.
const FALLBACK_TEMPLES: { id?: string; name: string; location: string; offering: string; price: number; offerPrice: number | null; image: string }[] = []

const ChadhavaSection = () => {
  const [temples, setTemples] = useState(FALLBACK_TEMPLES)

  useEffect(() => {
    fetch('/api/chadhava/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTemples(
            data.slice(0, 3).map((listing: any) => ({
              id: listing.id,
              name: listing.title,
              location: listing.location || '',
              offering: listing.description,
              price: listing.price,
              offerPrice: listing.offerPrice,
              image: listing.image
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback temples on error
      })
  }, [])

  return (
    <section id='home-chadhava' className='py-8 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-6'>
        <Typography
          variant='h2'
          className='font-bold mb-4 galaxy-glow-text'
          style={{ color: '#006241' }}
        >
          Sacred Chadhava Offerings
        </Typography>
        <Typography variant='body1' style={{ color: '#374151' }} className='max-w-2xl mx-auto'>
          Offer devotion and seeking blessings by presenting Chadhava at India&apos;s most revered temples from the comfort of your home.
        </Typography>
      </div>

      <Grid container spacing={4}>
        {temples.map((t, index) => (
          <Grid size={{ xs: 12, sm: 4, md: 4 }} key={index}>
            <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden'>
              <div>
                <div className='relative h-60 w-full overflow-hidden'>
                  <img src={t.image} alt={t.name} className='w-full h-full object-cover transition-transform duration-500 hover:scale-110' />
                  <div className='absolute top-4 left-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                    {t.location}
                  </div>
                </div>
                <CardContent className='p-6'>
                  <Typography variant='h5' className='font-bold mb-2' style={{ color: '#006241' }}>
                    {t.name}
                  </Typography>
                  <Typography variant='body2' className='mb-4 font-semibold' style={{ color: '#f97316' }}>
                    {t.offering}
                  </Typography>
                  <Typography variant='body2' style={{ color: '#4b5563' }} className='mb-6'>
                    Get Prasad delivered at home, along with a custom video of the offering.
                  </Typography>
                </CardContent>
              </div>
              <CardContent className='p-6 pt-0 flex justify-between items-center border-t border-emerald-100 mt-auto'>
                <div>
                  <span className='text-xs block' style={{ color: '#6b7280' }}>Starting from</span>
                  <span className='text-xl font-bold' style={{ color: '#006241' }}>
                    {hasOfferDiscount(t) && (
                      <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.75em' }}>
                        ₹{t.price}
                      </span>
                    )}
                    ₹{effectivePrice(t)}
                  </span>
                </div>
                <div className='flex flex-col gap-2'>
                  <Button
                    component={Link}
                    href={t.id ? `/front-pages/chadhava/${t.id}` : '/front-pages/chadhava'}
                    variant='outlined'
                    className='font-semibold'
                    style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#006241' }}
                  >
                    View Details
                  </Button>
                  <Button
                    component={Link}
                    href='/front-pages/chadhava'
                    className='galaxy-glow-btn font-bold px-6'
                  >
                    Book Chadhava
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <div className='text-center mt-12'>
        <Button 
          component={Link} 
          href='/front-pages/chadhava'
          variant='text' 
          className='font-bold'
          style={{ color: '#f97316' }}
        >
          View All Temples <i className='tabler-arrow-right ml-2' />
        </Button>
      </div>
    </section>
  )
}

export default ChadhavaSection
