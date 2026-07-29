'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import classnames from 'classnames'

import styles from './styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'

type Slide = {
  title: string
  subtitle: string
  image: string
  textColor?: string
  buttonText?: string
  buttonLink?: string
  buttonText2?: string
  buttonLink2?: string
}

// Fallback used only if the database has no "home" banners yet (e.g. before seeding),
// so the hero section never renders empty.
const FALLBACK_SLIDES: Slide[] = []

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES)

  useEffect(() => {
    fetch('/api/banners?page=home')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data)
          setCurrentSlide(0)
        }
      })
      .catch(() => {
        // Keep the fallback slide on error
      })
  }, [])

  // Slide rotation logic
  useEffect(() => {
    if (slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(timer)
  }, [slides.length])

  const activeSlide = slides[currentSlide] ?? slides[0]

  if (!activeSlide) return null

  return (
    <section id='home' className='relative overflow-hidden pbs-[40px] w-full min-h-[500px] flex items-center bg-[#faf7f2]/10 border-b border-sky-500/10'>
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={classnames('absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out', {
            'opacity-100 z-10': currentSlide === index,
            'opacity-0 z-0': currentSlide !== index
          })}
        >

          <img
            src={slide.image}
            alt={slide.title}
            className='w-full h-full object-cover absolute inset-0'
          />
        </div>
      ))}

      {/* Content */}
      <div className={classnames('relative z-30 w-full py-6', frontCommonStyles.layoutSpacing)}>
        <div className='max-w-2xl text-left'>
          {/* Slide Indicator Line */}
          <div className='flex gap-2 mb-4'>
            {slides.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={classnames('h-1 rounded-full cursor-pointer transition-all duration-300', {
                  'w-8 bg-sky-500': currentSlide === idx,
                  'w-2 bg-slate-300': currentSlide !== idx
                })}
              />
            ))}
          </div>

          <Typography
            className={classnames('font-extrabold sm:text-[48px] text-3xl mbe-4 leading-[54px] galaxy-glow-text transition-all duration-500 transform translate-y-0', {
              'text-slate-900': activeSlide.textColor !== 'light',
              'text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]': activeSlide.textColor === 'light'
            })}
            style={{ textShadow: activeSlide.textColor === 'light' ? '2px 2px 8px rgba(0,0,0,0.9)' : '0px 0px 10px rgba(2, 132, 199, 0.15)' }}
          >
            {activeSlide.title}
          </Typography>

          <Typography className={classnames('font-medium text-lg mb-8 leading-relaxed max-w-xl', {
              'text-slate-700': activeSlide.textColor !== 'light',
              'text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]': activeSlide.textColor === 'light'
          })}
          style={{ textShadow: activeSlide.textColor === 'light' ? '1px 1px 4px rgba(0,0,0,0.8)' : 'none' }}>
            {activeSlide.subtitle}
          </Typography>

          <div className='flex gap-4 items-center'>
            {activeSlide.buttonText && (
              <Button
                component={Link}
                size='large'
                href={activeSlide.buttonLink || '/front-pages/ecommerce'}
                className='galaxy-glow-btn hero-cta-btn font-bold px-8 py-3.5 text-lg'
              >
                {activeSlide.buttonText}
              </Button>
            )}
            {(activeSlide as any).buttonText2 && (
              <Button
                component={Link}
                size='large'
                href={(activeSlide as any).buttonLink2 || '/front-pages/ecommerce'}
                variant='outlined'
                className='border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 font-bold px-8 py-3.5 text-lg'
              >
                {(activeSlide as any).buttonText2}
              </Button>
            )}
          </div>

          <div className='mt-8 w-full max-w-md'>
            <form action='/front-pages/ecommerce' method='GET' className='relative flex items-center'>
              <input
                type='text'
                name='search'
                placeholder='Search products, gemstones, rudraksha...'
                className='w-full pl-5 pr-12 py-3.5 rounded-full border-2 border-emerald-500/30 focus:border-emerald-500 focus:outline-none bg-white shadow-md text-slate-700 placeholder:text-slate-400'
              />
              <button
                type='submit'
                className='absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white transition-colors flex items-center justify-center'
                aria-label='Search'
              >
                <i className='tabler-search text-lg' />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
