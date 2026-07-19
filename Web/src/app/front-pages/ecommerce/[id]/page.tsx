'use client'

import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'
import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { useCart } from '@/contexts/CartContext'
import ReviewsSection from '@/components/ReviewsSection'
import RelatedListings from '@/components/RelatedListings'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import ServiceFaq from '@/components/ServiceFaq'
import DetailPageTabs from '@/components/DetailPageTabs'
import MediaCarousel, { type MediaGalleryItem } from '@/components/MediaCarousel'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type Product = Priced & {
  id: string
  name: string
  category: string
  planet?: string | null
  purpose?: string | null
  image: string
  description: string
  sourceName?: string | null
  sourceLocation?: string | null
  significance?: string | null
  benefits?: string | null
  secondaryTabLabel?: string | null
  media?: MediaGalleryItem[] | null
}

const EcommerceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/ecommerce/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        
return res.json()
      })
      .then(data => setProduct(data))
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

  if (notFound || !product) {
    return (
      <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
        <div className='max-w-3xl mx-auto'>
          <Alert severity='error'>This product could not be found.</Alert>
          <Button component={Link} href='/front-pages/ecommerce' className='mt-4 font-bold' style={{ color: '#059669' }}>
            &larr; Back to the store
          </Button>
        </div>
      </div>
    )
  }

  const isGemstone = product.category === 'Gemstones'

  // Benefits are stored as one line per benefit — split + drop blank lines for display.
  const benefitLines = (product.benefits || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const hasSourceInfo = Boolean(product.sourceName || product.sourceLocation || product.significance)
  const secondaryTabLabel = product.secondaryTabLabel || 'Source & Certification'

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-5xl mx-auto'>
        <Button component={Link} href='/front-pages/ecommerce' className='mb-6 font-semibold' style={{ color: '#059669' }}>
          &larr; Back to the store
        </Button>

        <div className='galaxy-card overflow-hidden rounded-2xl' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className='relative h-72 md:h-96 w-full overflow-hidden'>
            <img src={product.image} alt={product.name} className='w-full h-full object-cover' />
            <div
              className='absolute inset-0'
              style={{ background: 'linear-gradient(to top, rgba(4,30,20,0.75) 0%, rgba(4,30,20,0.05) 55%, transparent 100%)' }}
            />
            {product.planet && (
              <div className='absolute top-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                {product.planet}
              </div>
            )}
            <div className='absolute bottom-0 left-0 right-0 p-6 md:p-8'>
              <Typography variant='h3' className='font-bold hero-overlay-text' style={{ color: '#fff', fontFamily: 'Cinzel, Georgia, serif', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                {product.name}
              </Typography>
              {product.purpose && (
                <Typography variant='subtitle1' className='font-semibold mt-1 hero-overlay-text' style={{ color: '#a7f3d0', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Purpose: {product.purpose}
                </Typography>
              )}
            </div>
          </div>

          {/* Persistent price + CTA — visible immediately, not gated behind the Pricing tab below */}
          <Box className='cta-highlight-bar flex flex-wrap items-center justify-between gap-4 p-4 md:p-5 mx-4 md:mx-6 mt-4'>
            <div>
              <Typography variant='h4' className='font-bold' style={{ color: '#059669' }}>
                {hasOfferDiscount(product) && (
                  <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.7em' }}>
                    ₹{product.price}
                  </span>
                )}
                ₹{effectivePrice(product)} {isGemstone ? '/ Carat' : ''}
              </Typography>
              {gstLabel(product) && (
                <Typography variant='caption' style={{ color: '#6b7280' }}>
                  {gstLabel(product)}
                </Typography>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outlined'
                size='large'
                onClick={() => addToCart({ id: product.id, name: product.name, price: effectivePrice(product), image: product.image, type: 'product', orderPayload: { productId: product.id } })}
                className='font-semibold px-6'
                style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}
              >
                Add to Cart
              </Button>
              <Button
                component={Link}
                href={`/front-pages/ecommerce?book=${product.id}`}
                size='large'
                className='galaxy-glow-btn cta-pulse-btn font-bold px-10'
              >
                Buy Now
              </Button>
            </div>
          </Box>

          <Box className='p-6 md:p-8'>
            <MediaCarousel media={product.media} title='More Glimpses' />
            <DetailPageTabs
              tabs={[
                {
                  key: 'about',
                  label: 'About Product',
                  content: (
                    <>
                      <Typography className='leading-relaxed mb-4' style={{ color: '#374151' }}>
                        {product.description}
                      </Typography>
                      <Typography variant='body2' style={{ color: '#6b7280' }}>
                        All products include laboratory certification card and Vedic purification rituals prior to shipment.
                      </Typography>
                    </>
                  )
                },
                {
                  key: 'source',
                  label: secondaryTabLabel,
                  hidden: !hasSourceInfo,
                  content: (
                    <div className='flex flex-col gap-2'>
                      {product.sourceName && (
                        <Typography variant='body2' style={{ color: '#4b5563' }}>
                          <strong style={{ color: '#374151' }}>Source:</strong> {product.sourceName}
                        </Typography>
                      )}
                      {product.sourceLocation && (
                        <Typography variant='body2' style={{ color: '#4b5563' }}>
                          <strong style={{ color: '#374151' }}>Origin:</strong> {product.sourceLocation}
                        </Typography>
                      )}
                      {product.significance && (
                        <Typography variant='body2' className='leading-relaxed mt-1' style={{ color: '#4b5563' }}>
                          {product.significance}
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
                          <span style={{ color: '#059669', fontWeight: 700, lineHeight: '1.4' }}>✓</span>
                          <Typography variant='body2' style={{ color: '#374151' }}>{benefit}</Typography>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  key: 'process',
                  label: 'Process',
                  content: <HowItWorksSection page='ecommerce' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How Ordering Works' />
                },
                {
                  key: 'pricing',
                  label: 'Pricing',
                  content: (
                    <Box className='flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div>
                        <Typography variant='h5' className='font-bold' style={{ color: '#059669' }}>
                          {hasOfferDiscount(product) && (
                            <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.85em' }}>
                              ₹{product.price}
                            </span>
                          )}
                          ₹{effectivePrice(product)} {isGemstone ? '/ Carat' : ''}
                        </Typography>
                        {gstLabel(product) && (
                          <Typography variant='caption' style={{ color: '#6b7280' }}>
                            {gstLabel(product)}
                          </Typography>
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          variant='outlined'
                          onClick={() => addToCart({ id: product.id, name: product.name, price: effectivePrice(product), image: product.image, type: 'product', orderPayload: { productId: product.id } })}
                          className='font-semibold px-6'
                          style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}
                        >
                          Add to Cart
                        </Button>
                        <Button
                          component={Link}
                          href={`/front-pages/ecommerce?book=${product.id}`}
                          className='galaxy-glow-btn font-bold px-8'
                        >
                          Buy Now
                        </Button>
                      </div>
                    </Box>
                  )
                },
                {
                  key: 'reviews',
                  label: 'Reviews',
                  content: <ReviewsSection orderType='ECOMMERCE' targetId={product.id} />
                },
                {
                  key: 'faqs',
                  label: 'FAQs',
                  content: (
                    <ServiceFaq
                      page='ecommerce'
                      title='Frequently Asked Questions'
                      items={[
                        {
                          question: 'Are your gemstones and rudrakshas certified?',
                          answer:
                            'Yes, every gemstone and rudraksha bead sold on Mandir Setu is accompanied by an authenticity certificate from government-approved independent gemological laboratories.'
                        },
                        {
                          question: "What does it mean for an item to be 'energized'?",
                          answer:
                            "Before dispatch, each item undergoes customized Vedic mantra purification and activation rituals conducted by verified pandits aligned with the item's ruling deity or astrological planet."
                        },
                        {
                          question: 'What is your return and exchange policy?',
                          answer:
                            'We offer a 7-day hassle-free return and exchange policy on all products, provided they are in their original packaging and have not been damaged or altered.'
                        },
                        {
                          question: 'How is the carat size for gemstones calculated?',
                          answer:
                            'You can use our interactive slider on the product checkout to choose custom sizes (3.5 to 12.5 carats). Prices scale dynamically based on the exact weight selected.'
                        }
                      ]}
                    />
                  )
                }
              ]}
            />
          </Box>
        </div>

        <RelatedListings
          fetchUrl={`/api/ecommerce/products?category=${encodeURIComponent(product.category)}`}
          currentId={product.id}
          basePath='/front-pages/ecommerce'
          title='Other Products You May Like'
          mapItem={(raw: any) => ({
            id: raw.id,
            title: raw.name,
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

export default EcommerceDetailPage
