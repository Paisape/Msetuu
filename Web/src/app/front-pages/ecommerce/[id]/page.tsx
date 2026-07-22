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

export default function EcommerceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/ecommerce/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setProduct(data)
        setSelectedImage(data.image)
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

  if (notFound || !product) {
    return (
      <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
        <div className='max-w-3xl mx-auto'>
          <Alert severity='error'>This product could not be found.</Alert>
          <Button component={Link} href='/front-pages/ecommerce' className='mt-4 font-bold text-emerald-700'>
            &larr; Back to Store
          </Button>
        </div>
      </div>
    )
  }

  const isGemstone = product.category === 'Gemstones'
  const discountPercent = hasOfferDiscount(product)
    ? Math.round(((product.price! - product.offerPrice!) / product.price!) * 100)
    : 0

  const benefitLines = (product.benefits || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const galleryImages = [
    { type: 'image' as const, url: product.image, title: product.name },
    ...(product.media || [])
  ]

  const hasSourceInfo = Boolean(product.sourceName || product.sourceLocation || product.significance)
  const secondaryTabLabel = product.secondaryTabLabel || 'Source & Certification'

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: effectivePrice(product),
      image: product.image,
      type: 'product',
      orderPayload: { productId: product.id }
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto space-y-12'>
        
        {/* Breadcrumb Header */}
        <div className='flex items-center gap-2 text-sm text-slate-400'>
          <Link href='/front-pages/ecommerce' className='hover:text-emerald-400 transition-colors'>
            Store
          </Link>
          <span>/</span>
          <span className='text-emerald-400 font-semibold'>{product.category}</span>
          <span>/</span>
          <span className='text-slate-200 font-medium truncate max-w-xs'>{product.name}</span>
        </div>

        {/* 🌟 GEMS MANTRA SPLIT TOP HERO SECTION (Image Left, Purchase Box Right) */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'>
          
          {/* LEFT SIDE: MAIN IMAGE & GALLERY THUMBNAILS & TRUST BADGES */}
          <div className='lg:col-span-6 space-y-6'>
            <div className='galaxy-card p-4 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden group'>
              {discountPercent > 0 && (
                <div className='absolute top-6 left-6 z-10 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider'>
                  {discountPercent}% OFF
                </div>
              )}
              {product.planet && (
                <div className='absolute top-6 right-6 z-10 bg-emerald-950/80 backdrop-blur-md text-emerald-300 font-semibold text-xs px-3 py-1.5 rounded-full border border-emerald-500/30'>
                  Planet: {product.planet}
                </div>
              )}

              <div className='relative h-80 sm:h-[420px] w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center'>
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  className='w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500'
                />
              </div>

              {/* Gallery Thumbnails Carousel */}
              {galleryImages.length > 1 && (
                <div className='flex items-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-none'>
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                        (selectedImage || product.image) === img.url
                          ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20'
                          : 'border-slate-800 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt='' className='w-full h-full object-cover' />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trust Guarantee Badges under Left Image */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/10 backdrop-blur-md text-center text-xs'>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>📜</div>
                <div className='font-bold text-slate-200'>Lab Certified</div>
                <div className='text-slate-400 text-[10px]'>100% Genuine</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🪔</div>
                <div className='font-bold text-slate-200'>Vedic Energized</div>
                <div className='text-slate-400 text-[10px]'>Purified Vidhi</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🚚</div>
                <div className='font-bold text-slate-200'>Fast Shipping</div>
                <div className='text-slate-400 text-[10px]'>Safe Packaging</div>
              </div>
              <div className='space-y-1 p-2'>
                <div className='text-xl'>🔒</div>
                <div className='font-bold text-slate-200'>Secure Pay</div>
                <div className='text-slate-400 text-[10px]'>UPI, Card, Net</div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: PRODUCT DETAILS, PRICING, SPECS & ACTION BUTTONS */}
          <div className='lg:col-span-6 space-y-6'>
            <div>
              <div className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3'>
                <span>🪷</span> Sacred Spiritual Product
              </div>
              <h1 className='text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight tracking-tight mb-3'>
                {product.name}
              </h1>

              {/* Rating & Reviews Bar */}
              <div className='flex items-center gap-3 text-sm mb-4'>
                <div className='flex items-center text-amber-400 font-bold'>
                  ★★★★★ <span className='ml-1 text-slate-200'>4.9</span>
                </div>
                <span className='text-slate-600'>|</span>
                <span className='text-emerald-400 font-medium cursor-pointer hover:underline'>
                  125+ Verified Devotee Reviews
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className='p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-2'>
              <div className='flex items-baseline gap-3'>
                <span className='text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500'>
                  ₹{effectivePrice(product)}
                </span>
                {hasOfferDiscount(product) && (
                  <span className='text-lg text-slate-400 line-through font-semibold'>
                    ₹{product.price}
                  </span>
                )}
                {isGemstone && <span className='text-sm text-slate-400 font-medium'>/ Carat</span>}
              </div>
              <div className='text-xs text-slate-400 font-medium'>
                {gstLabel(product) || 'Inclusive of all taxes & Vedic lab certification fees'}
              </div>
            </div>

            {/* Purpose & Specs */}
            {product.purpose && (
              <div className='p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-sm'>
                <span className='text-emerald-400 font-bold'>Spiritual Purpose: </span>
                <span className='text-slate-200'>{product.purpose}</span>
              </div>
            )}

            {/* Short Highlights */}
            <div className='space-y-2'>
              <div className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Product Highlights</div>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <div className='p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300'>
                  <strong className='text-emerald-400'>Category:</strong> {product.category}
                </div>
                {product.planet && (
                  <div className='p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300'>
                    <strong className='text-emerald-400'>Rashi/Planet:</strong> {product.planet}
                  </div>
                )}
                <div className='p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300'>
                  <strong className='text-emerald-400'>Authenticity:</strong> Lab Tested Card
                </div>
                <div className='p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300'>
                  <strong className='text-emerald-400'>Dispatch:</strong> Within 24 Hours
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className='space-y-3 pt-2'>
              {added && <Alert severity='success'>Product added to cart!</Alert>}

              <div className='flex flex-col sm:flex-row gap-3'>
                <Button
                  fullWidth
                  variant='outlined'
                  size='large'
                  onClick={handleAddToCart}
                  className='py-3.5 font-bold text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10'
                >
                  🛒 Add to Cart
                </Button>
                <Button
                  fullWidth
                  component={Link}
                  href={`/front-pages/ecommerce?book=${product.id}`}
                  variant='contained'
                  size='large'
                  className='py-3.5 font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                >
                  ⚡ Buy Now
                </Button>
              </div>
            </div>

          </div>

        </div>

        {/* 📜 FULL BODY WIDTH SECTION (After Image Area Finishes) */}
        <div className='pt-8 border-t border-emerald-500/20 space-y-12'>
          
          {/* Detail Tabs */}
          <div className='galaxy-card p-6 md:p-8 rounded-3xl border border-emerald-500/20 shadow-xl'>
            <DetailPageTabs
              tabs={[
                {
                  key: 'about',
                  label: 'About Product',
                  content: (
                    <div className='space-y-4 text-slate-300 leading-relaxed'>
                      <Typography className='text-base leading-relaxed' style={{ color: '#d1d5db' }}>
                        {product.description}
                      </Typography>
                      <div className='p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300'>
                        ℹ️ Every item is lab-certified and purified with Ganga Jal and Vedic mantras before dispatch.
                      </div>
                    </div>
                  )
                },
                {
                  key: 'source',
                  label: secondaryTabLabel,
                  hidden: !hasSourceInfo,
                  content: (
                    <div className='space-y-3 text-slate-300'>
                      {product.sourceName && (
                        <div>
                          <strong className='text-emerald-400'>Source / Origin:</strong> {product.sourceName}
                        </div>
                      )}
                      {product.sourceLocation && (
                        <div>
                          <strong className='text-emerald-400'>Sacred Location:</strong> {product.sourceLocation}
                        </div>
                      )}
                      {product.significance && (
                        <div className='leading-relaxed pt-2 text-slate-300'>
                          {product.significance}
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
                          <span className='text-emerald-400 font-bold text-lg'>✓</span>
                          <span className='text-slate-200 text-sm'>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  key: 'process',
                  label: 'How It Works',
                  content: <HowItWorksSection page='ecommerce' items={DEFAULT_HOW_IT_WORKS_STEPS} title='How Ordering Works' />
                }
              ]}
            />
          </div>

          {/* Service FAQ Section */}
          <ServiceFaq items={[]} />

          {/* Devotee Reviews */}
          <ReviewsSection orderType='ECOMMERCE' targetId={product.id} />

          {/* Related Products */}
          <RelatedListings
            fetchUrl='/api/ecommerce/products'
            currentId={product.id}
            basePath='/front-pages/ecommerce'
            mapItem={(item: any) => ({
              id: item.id,
              title: item.name,
              price: effectivePrice(item),
              offerPrice: item.offerPrice,
              image: item.image
            })}
          />

        </div>

      </div>
    </div>
  )
}
