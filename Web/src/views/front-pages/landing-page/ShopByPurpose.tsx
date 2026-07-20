'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

type PurposeType = {
  label: string
  image: string
}

// Fallback used only if the database has no Shop Purpose tiles yet (e.g. before seeding).
const FALLBACK_PURPOSES: PurposeType[] = []

const ShopByPurpose = () => {
  const [purposes, setPurposes] = useState<PurposeType[]>(FALLBACK_PURPOSES)

  useEffect(() => {
    fetch('/api/shop-purposes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setPurposes(data)
      })
      .catch(() => {
        // Keep the fallback tiles on error
      })
  }, [])

  return (
    <section id='shop-purpose' className='py-6 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-4'>
        <Typography
          variant='h3'
          className='font-bold mb-2 galaxy-glow-text'
          style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#006241' }}
        >
          Shop by Purpose
        </Typography>
      </div>

      <div className='flex flex-wrap justify-center items-center gap-6 md:gap-8'>
        {purposes.map((p, index) => (
          <Link
            key={index}
            href={`/front-pages/ecommerce?purpose=${encodeURIComponent(p.label)}`}
            className='flex flex-col items-center group transition-all duration-300 transform hover:scale-105'
            style={{ width: '110px' }}
          >
            {/* Circle Wrapper */}
            <div className='w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-200/60 bg-white/80 p-1 flex items-center justify-center shadow-md group-hover:border-emerald-400 group-hover:shadow-emerald-400/25 transition-all duration-300'>
              <img
                src={p.image}
                alt={p.label}
                className='w-full h-full object-cover rounded-full'
              />
            </div>
            {/* Label */}
            <Typography
              className='text-xs font-bold mt-3 transition-colors duration-200 text-center capitalize'
              style={{ letterSpacing: '0.5px', color: '#374151' }}
            >
              {p.label}
            </Typography>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ShopByPurpose
