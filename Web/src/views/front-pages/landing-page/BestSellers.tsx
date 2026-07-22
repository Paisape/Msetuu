'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

import { useCart } from '@/contexts/CartContext'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type BestSellerProduct = Priced & {
  id: string
  name: string
  rating: number
  reviews: number
  image: string
  purpose: string
}

// Fallback used only if the database has no Best Seller products yet (e.g. before seeding). No
// real `id` here (it's not a real product row) — "View Details" falls back to the store listing
// page for these instead of a broken detail-page link.
const FALLBACK_PRODUCTS: BestSellerProduct[] = []

const BestSellers = () => {
  const { addToCart, checkout } = useCart()
  const [products, setProducts] = useState<BestSellerProduct[]>(FALLBACK_PRODUCTS)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ecommerce/products?bestseller=1')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(
            data.slice(0, 4).map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              offerPrice: p.offerPrice,
              gstPercentage: p.gstPercentage,
              gstInclusive: p.gstInclusive,
              rating: p.rating ?? 5,
              reviews: p.reviewsCount ?? 0,
              image: p.image,
              purpose: p.purpose || p.category
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback products on error
      })
  }, [])

  const handleAddToCart = (p: BestSellerProduct) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: effectivePrice(p),
      image: p.image,
      type: 'product',
      orderPayload: { productId: p.id }
    })
  }

  const handleBuyNow = async (p: BestSellerProduct) => {
    setBuyingId(p.id)

    try {
      await checkout({
        itemsOverride: [
          {
            id: p.id,
            name: p.name,
            price: effectivePrice(p),
            image: p.image,
            quantity: 1,
            type: 'product',
            orderPayload: { productId: p.id }
          }
        ]
      })
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <section id='home-bestsellers' className='py-8 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-6'>
        <Typography variant='h2' className='font-bold mb-4 galaxy-glow-text' style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#006241' }}>
          Best Sellers
        </Typography>
      </div>

      <Grid container spacing={4}>
        {products.map((p, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden relative border border-slate-200/60 rounded-2xl bg-white shadow-sm'>
              <div>
                {/* Image Section */}
                <div className='relative h-64 w-full overflow-hidden bg-slate-50'>
                  <img src={p.image} alt={p.name} className='w-full h-full object-cover transition-transform duration-500 hover:scale-105' />
                  
                  {/* Yellow Discount Flag */}
                  <Box className='absolute top-3 left-3 bg-[#eab308] text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1'>
                    🔖 ₹500 OFF on personal order
                  </Box>
                </div>

                {/* Content Section */}
                <CardContent className='p-4 pb-1'>
                  <Typography className='font-bold text-slate-800 text-sm mb-1 leading-snug line-clamp-2 h-10'>
                    {p.name}
                  </Typography>
                  
                  {/* Stars & Reviews */}
                  <div className='flex items-center gap-1.5 mb-2'>
                    <div className='flex text-amber-400 text-xs'>
                      <i className='tabler-star-filled' />
                      <i className='tabler-star-filled' />
                      <i className='tabler-star-filled' />
                      <i className='tabler-star-filled' />
                      <i className='tabler-star-filled' />
                    </div>
                    <Typography className='text-[11px] text-slate-500 font-semibold'>
                      {p.reviews} reviews
                    </Typography>
                  </div>
                </CardContent>
              </div>

              {/* Price & Action Section */}
              <CardContent className='p-4 pt-0 flex flex-col gap-2 mt-auto'>
                <div className='flex justify-between items-center'>
                  <div className='flex flex-col gap-0.5'>
                    <div className='flex items-baseline gap-2'>
                      <Typography className='text-md font-extrabold text-slate-800'>
                        ₹{effectivePrice(p)}
                      </Typography>
                      {hasOfferDiscount(p) && (
                        <Typography className='text-xs text-slate-400 line-through'>
                          ₹{p.price}
                        </Typography>
                      )}
                    </div>
                    {gstLabel(p) && <Typography className='text-[10px] text-slate-400'>{gstLabel(p)}</Typography>}
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => handleAddToCart(p)}
                    className='bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1'
                    style={{ textTransform: 'none' }}
                  >
                    <i className='tabler-plus text-xs' /> Add
                  </Button>
                </div>
                <Button
                  onClick={() => handleBuyNow(p)}
                  disabled={buyingId === p.id}
                  fullWidth
                  size='small'
                  className='font-bold'
                  style={{ backgroundColor: '#006241', color: '#fff', textTransform: 'none' }}
                >
                  {buyingId === p.id ? 'Processing…' : 'Buy Now'}
                </Button>
                <Button
                  component={Link}
                  href={p.id ? `/front-pages/ecommerce/${p.id}` : '/front-pages/ecommerce'}
                  variant='outlined'
                  fullWidth
                  size='small'
                  className='font-semibold'
                  style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#006241', textTransform: 'none' }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <div className='text-center mt-12'>
        <Button 
          component={Link} 
          href='/front-pages/ecommerce'
          variant='text' 
          className='text-emerald-600 font-bold hover:text-emerald-700'
        >
          Explore Full Store <i className='tabler-arrow-right ml-2' />
        </Button>
      </div>
    </section>
  )
}

export default BestSellers
