'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

import { effectivePrice, hasOfferDiscount } from '@/libs/pricing'

// Fallback used only if the database has no E-Puja listings yet (e.g. before seeding). No `id`
// here — "View Details" falls back to the listing page for these since there's no real detail
// page to link to.
const FALLBACK_PUJAS: { id?: string; name: string; category: string; offering: string; price: number; offerPrice: number | null; image: string }[] = [
  {
    name: 'Maha Mrityunjaya Homa',
    category: 'Mahadev',
    offering: 'Vedic ritual for health, longevity, and protection from negative energies.',
    price: 2100,
    offerPrice: null,
    image: '/images/devotional/mahakaleshwar.jpg'
  },
  {
    name: 'Ganesha Atharvashirsha & Abhishek',
    category: 'Ganesha',
    offering: 'Clears business blockages and invokes wisdom and success.',
    price: 1100,
    offerPrice: null,
    image: '/images/devotional/siddhivinayak.jpg'
  },
  {
    name: 'Kanakadhara Stotram & Lakshmi Havan',
    category: 'Lakshmi',
    offering: 'Wealth enhancement ritual invoking Goddess Lakshmi.',
    price: 1500,
    offerPrice: null,
    image: '/images/devotional/kashi.jpg'
  }
]

const EPujaSection = () => {
  const [pujas, setPujas] = useState(FALLBACK_PUJAS)

  useEffect(() => {
    fetch('/api/epuja/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPujas(
            data.slice(0, 3).map((listing: any) => ({
              id: listing.id,
              name: listing.title,
              category: listing.category,
              offering: listing.description,
              price: listing.price,
              offerPrice: listing.packages?.[0]?.offerPrice ?? null,
              image: listing.image
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback pujas on error
      })
  }, [])

  return (
    <section id='home-epuja' className='py-8 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-6'>
        <Typography
          variant='h2'
          className='font-bold mb-4 galaxy-glow-text'
          style={{ color: '#006241' }}
        >
          Interactive E-Puja Offerings
        </Typography>
        <Typography variant='body1' style={{ color: '#374151' }} className='max-w-2xl mx-auto'>
          Book authentic Vedic Pujas performed by certified pandits at holy pilgrimage sites, with a personalized video of your ritual.
        </Typography>
      </div>

      <Grid container spacing={4}>
        {pujas.map((p, index) => (
          <Grid size={{ xs: 12, sm: 4, md: 4 }} key={index}>
            <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden'>
              <div>
                <div className='relative h-60 w-full overflow-hidden'>
                  <img src={p.image} alt={p.name} className='w-full h-full object-cover transition-transform duration-500 hover:scale-110' />
                  <div className='absolute top-4 left-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                    {p.category}
                  </div>
                </div>
                <CardContent className='p-6'>
                  <Typography variant='h5' className='font-bold mb-2' style={{ color: '#006241' }}>
                    {p.name}
                  </Typography>
                  <Typography variant='body2' style={{ color: '#4b5563' }} className='mb-6 line-clamp-2'>
                    {p.offering}
                  </Typography>
                </CardContent>
              </div>
              <CardContent className='p-6 pt-0 flex justify-between items-center border-t border-emerald-100 mt-auto'>
                <div>
                  <span className='text-xs block' style={{ color: '#6b7280' }}>Starting from</span>
                  <span className='text-xl font-bold' style={{ color: '#006241' }}>
                    {hasOfferDiscount(p) && (
                      <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.75em' }}>
                        ₹{p.price}
                      </span>
                    )}
                    ₹{effectivePrice(p)}
                  </span>
                </div>
                <div className='flex flex-col gap-2'>
                  <Button
                    component={Link}
                    href={p.id ? `/front-pages/epuja/${p.id}` : '/front-pages/epuja'}
                    variant='outlined'
                    className='font-semibold'
                    style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#006241' }}
                  >
                    View Details
                  </Button>
                  <Button
                    component={Link}
                    href='/front-pages/epuja'
                    className='galaxy-glow-btn font-bold px-6'
                  >
                    Book E-Puja
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
          href='/front-pages/epuja'
          variant='text'
          className='font-bold'
          style={{ color: '#f97316' }}
        >
          View All E-Pujas <i className='tabler-arrow-right ml-2' />
        </Button>
      </div>
    </section>
  )
}

export default EPujaSection
