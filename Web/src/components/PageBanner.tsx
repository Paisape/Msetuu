'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

type PageBannerProps = {

  // Matches the Banner.page value managed in the admin Content Management console.
  page: string
  defaultTitle: string
  defaultSubtitle: string

  // 'emerald' = light background pages (color #059669 title / #374151 subtitle).
  // 'dark' = dark background pages like Darshan/Geo-tag (text-white / text-slate-400).
  variant?: 'emerald' | 'dark'
}

// Renders each service page's centered title + subtitle header, sourced from the
// admin-managed Banner catalog (/api/banners?page=<slug>) with a static fallback so the
// page still looks right before any banner is configured for that page. The admin form's
// buttonText/buttonLink fields apply to every page (not just Home), so they're rendered here
// too — using the same `galaxy-glow-btn` class as the Home hero CTA, which always paints
// white text regardless of page background.
const PageBanner = ({ page, defaultTitle, defaultSubtitle, variant = 'emerald' }: PageBannerProps) => {
  const [banner, setBanner] = useState<{
    title: string
    subtitle?: string | null
    buttonText?: string | null
    buttonLink?: string | null
    buttonText2?: string | null
    buttonLink2?: string | null
  } | null>(null)

  useEffect(() => {
    fetch(`/api/banners?page=${encodeURIComponent(page)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setBanner(data[0])
      })
      .catch(() => {
        // Keep the default title/subtitle on error
      })
  }, [page])

  return (
    <div className='text-center mb-16'>
      <Typography
        variant='h2'
        className={variant === 'dark' ? 'font-bold text-white mb-4 galaxy-glow-text' : 'font-bold mb-4 galaxy-glow-text'}
        style={variant === 'dark' ? undefined : { color: '#059669' }}
      >
        {banner?.title || defaultTitle}
      </Typography>
      <Typography
        variant='body1'
        className={variant === 'dark' ? 'text-slate-400 max-w-2xl mx-auto' : 'max-w-2xl mx-auto'}
        style={variant === 'dark' ? undefined : { color: '#374151' }}
      >
        {banner?.subtitle || defaultSubtitle}
      </Typography>
      {(banner?.buttonText || banner?.buttonText2) && (
        <div className='flex gap-3 justify-center flex-wrap mt-6'>
          {banner?.buttonText && (
            <Button
              component={Link}
              href={banner.buttonLink || '#'}
              size='large'
              className='galaxy-glow-btn font-bold px-8'
            >
              {banner.buttonText}
            </Button>
          )}
          {banner?.buttonText2 && (
            <Button
              component={Link}
              href={banner.buttonLink2 || '#'}
              size='large'
              variant='outlined'
              className='font-bold px-8'
            >
              {banner.buttonText2}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default PageBanner
