'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'

import { useCart } from '@/contexts/CartContext'
import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import PageBanner from '@/components/PageBanner'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

const filterFieldSx = {
  '& .MuiInputLabel-root': { color: '#6b7280' },
  '& .MuiOutlinedInput-root': {
    color: '#0f172a',
    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
    '&:hover fieldset': { borderColor: '#10b981' },
    '&.Mui-focused fieldset': { borderColor: '#059669' }
  }
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc'

type Product = Priced & {
  id: string
  name: string
  category: string
  planet?: string
  purpose: string
  image: string
  description: string
  isGemstone?: boolean
}

// Fallback used only if the database has no products yet (e.g. before seeding).
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'e1',
    name: 'Energized 5 Mukhi Rudraksha Mala',
    category: 'Rudraksha',
    price: 499,
    planet: 'Jupiter',
    purpose: 'Health',
    image: '/images/devotional/kedarnath.jpg',
    description: 'Authentic 108 beads Panchmukhi Rudraksha Mala sourced from Nepal. Blessed by Vedic rituals.'
  }
]

const EcommercePage = () => {
  const { addToCart } = useCart()
  const searchParams = useSearchParams()
  const purposeParam = searchParams.get('purpose')
  const bookId = searchParams.get('book')

  // States
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [purposeFilter, setPurposeFilter] = useState<string | null>(purposeParam)
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Storefront filters
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 5000])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const priceTouched = useRef(false)

  const [carat, setCarat] = useState<number>(5.5)
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState('')
  const [success, setSuccess] = useState(false)

  const categories = ['All', 'Bracelets', 'Rudraksha', 'Gemstones', 'Pyramids', 'Shree Yantra', 'Brass Idols']

  useEffect(() => {
    fetch('/api/ecommerce/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              offerPrice: p.offerPrice,
              gstPercentage: p.gstPercentage,
              gstInclusive: p.gstInclusive,
              planet: p.planet,
              purpose: p.purpose || p.category,
              image: p.image,
              description: p.description,
              isGemstone: p.category === 'Gemstones'
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback products on error
      })
  }, [])

  // Keep the purpose filter (from the "Shop by Purpose" tile link, e.g. ?purpose=Wealth) in sync
  useEffect(() => {
    setPurposeFilter(purposeParam)
  }, [purposeParam])

  // Recompute the price slider's min/max whenever the product catalog loads/changes. Only
  // snaps the user's selected range back to the full bounds if they haven't touched the
  // slider yet — otherwise a background refetch would silently reset their chosen filter.
  useEffect(() => {
    if (products.length === 0) return

    const prices = products.map(p => effectivePrice(p))
    const min = Math.floor(Math.min(...prices))
    const max = Math.ceil(Math.max(...prices))

    setPriceBounds([min, max])
    if (!priceTouched.current) setPriceRange([min, max])
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const result = products.filter(p => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false
      if (purposeFilter && p.purpose !== purposeFilter) return false
      if (query && !p.name.toLowerCase().includes(query) && !p.category.toLowerCase().includes(query)) return false

      const price = effectivePrice(p)

      if (price < priceRange[0] || price > priceRange[1]) return false

      return true
    })

    switch (sortBy) {
      case 'price-asc':
        return result.sort((a, b) => effectivePrice(a) - effectivePrice(b))
      case 'price-desc':
        return result.sort((a, b) => effectivePrice(b) - effectivePrice(a))
      case 'name-asc':
        return result.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return result
    }
  }, [products, selectedCategory, purposeFilter, searchQuery, priceRange, sortBy])

  const hasActiveFilters = selectedCategory !== 'All' || Boolean(purposeFilter) || Boolean(searchQuery) || priceTouched.current

  const handleClearFilters = () => {
    setSelectedCategory('All')
    setPurposeFilter(null)
    setSearchQuery('')
    setSortBy('featured')
    priceTouched.current = false
    setPriceRange(priceBounds)
  }

  const handleOpenBooking = (item: Product) => {
    setSelectedProduct(item)
    setCarat(5.5)
    setQuantity(1)
    setBookingOpen(true)
  }

  const handleClose = () => {
    setBookingOpen(false)
    setSuccess(false)
  }

  // "Buy Now" on the detail page (/front-pages/ecommerce/[id]) links back here with
  // ?book=<productId> so the same purchase dialog opens automatically.
  useEffect(() => {
    if (!bookId) return
    const match = products.find(p => p.id === bookId)

    if (match) handleOpenBooking(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, products])

  const getPrice = () => {
    if (!selectedProduct) return 0
    const rate = effectivePrice(selectedProduct)
    const basePrice = selectedProduct.isGemstone ? Math.round(rate * carat) : rate

    
return basePrice * quantity
  }

  const handleAddToCart = (item: Product, chosenCarat?: number) => {
    const rate = effectivePrice(item)
    const price = item.isGemstone && chosenCarat ? Math.round(rate * chosenCarat) : rate

    addToCart({
      id: item.isGemstone && chosenCarat ? `${item.id}-${chosenCarat}` : item.id,
      name: item.isGemstone && chosenCarat ? `${item.name} (${chosenCarat} Carats)` : item.name,
      price,
      image: item.image,
      type: 'product',
      orderPayload: { productId: item.id, carat: item.isGemstone ? chosenCarat : undefined }
    })
    handleClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    const price = getPrice()

    addToCart({
      id: selectedProduct.isGemstone ? `${selectedProduct.id}-${carat}` : selectedProduct.id,
      name: selectedProduct.isGemstone ? `${selectedProduct.name} (${carat} Carats)` : selectedProduct.name,
      price,
      image: selectedProduct.image,
      type: 'product',
      orderPayload: { productId: selectedProduct.id, carat: selectedProduct.isGemstone ? carat : undefined },
      details: {
        carat: selectedProduct.isGemstone ? carat : undefined,
        quantity,
        shippingAddress: address
      }
    })

    setSuccess(true)
    setTimeout(() => {
      handleClose()
    }, 1500)
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Banner */}
        <PageBanner
          page='ecommerce'
          defaultTitle='Remedial E-Commerce Store'
          defaultSubtitle='Authentic, certified gemstones, energized malas, Vastu pyramids, and sacred brass idols blessed by Vedic pandits.'
        />

        {/* Categories Tabs */}
        <div className='flex flex-wrap justify-center gap-3 mb-12'>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                selectedCategory === cat
                  ? 'border-emerald-400 text-white shadow-md'
                  : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-300'
              }`}
              style={{
                background: selectedCategory === cat
                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                  : 'white'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {purposeFilter && (
          <div className='flex justify-center mb-8'>
            <button
              onClick={() => setPurposeFilter(null)}
              className='px-4 py-2 rounded-full text-sm font-semibold border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center gap-2'
            >
              Purpose: {purposeFilter}
              <i className='tabler-x text-xs' />
            </button>
          </div>
        )}

        {/* Storefront layout: filter sidebar + product grid */}
        <Grid container spacing={6}>
          {/* Filters Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card className='galaxy-card p-5' style={{ position: 'sticky', top: 96 }}>
              <div className='flex items-center gap-2 mb-5'>
                <i className='tabler-adjustments text-lg' style={{ color: '#059669' }} />
                <Typography variant='subtitle1' className='font-bold' style={{ color: '#047857' }}>
                  Filters
                </Typography>
              </div>

              <TextField
                fullWidth
                size='small'
                placeholder='Search products...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search text-base' style={{ color: '#6b7280' }} />
                    </InputAdornment>
                  )
                }}
                sx={filterFieldSx}
                className='mb-6'
              />

              <Typography variant='body2' className='font-semibold mb-2' style={{ color: '#374151' }}>
                Price: ₹{priceRange[0]} – ₹{priceRange[1]}
              </Typography>
              <Slider
                value={priceRange}
                min={priceBounds[0]}
                max={priceBounds[1]}
                onChange={(_, val) => {
                  priceTouched.current = true
                  setPriceRange(val as [number, number])
                }}
                valueLabelDisplay='auto'
                valueLabelFormat={v => `₹${v}`}
                sx={{ color: '#10b981', mb: 5, '& .MuiSlider-thumb': { border: '2px solid white' } }}
              />

              {hasActiveFilters && (
                <Button
                  size='small'
                  fullWidth
                  variant='outlined'
                  onClick={handleClearFilters}
                  startIcon={<i className='tabler-filter-x' />}
                  className='font-semibold'
                  style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          </Grid>

          {/* Products */}
          <Grid size={{ xs: 12, md: 9 }}>
            <div className='flex items-center justify-between flex-wrap gap-3 mb-6'>
              <Typography variant='body2' style={{ color: '#6b7280' }}>
                {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} found
              </Typography>
              <TextField
                select
                size='small'
                label='Sort By'
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                sx={{ minWidth: 200, ...filterFieldSx }}
              >
                <MenuItem value='featured'>Featured</MenuItem>
                <MenuItem value='price-asc'>Price: Low to High</MenuItem>
                <MenuItem value='price-desc'>Price: High to Low</MenuItem>
                <MenuItem value='name-asc'>Name: A to Z</MenuItem>
              </TextField>
            </div>

            {filteredProducts.length === 0 ? (
              <Card className='galaxy-card p-12 text-center'>
                <i className='tabler-mood-empty text-4xl mb-3' style={{ color: '#9ca3af' }} />
                <Typography variant='h6' className='font-bold mb-1' style={{ color: '#374151' }}>
                  No products match your filters
                </Typography>
                <Typography variant='body2' className='mb-4' style={{ color: '#6b7280' }}>
                  Try adjusting your search, category, or price range.
                </Typography>
                <Button
                  variant='outlined'
                  onClick={handleClearFilters}
                  style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <Grid container spacing={6}>
                {filteredProducts.map((p) => (
            <Grid size={{ xs: 12, sm: 4, md: 4 }} key={p.id}>
              <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden relative'>
                <div className='relative h-48 w-full overflow-hidden'>
                  <img src={p.image} alt={p.name} className='w-full h-full object-cover' />
                  {p.planet && (
                    <div className='absolute bottom-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                      {p.planet}
                    </div>
                  )}
                </div>
                <CardContent className='p-5 flex flex-col flex-1'>
                  <Typography variant='subtitle2' className='font-semibold mb-1 truncate' style={{ color: '#10b981' }}>
                    Purpose: {p.purpose}
                  </Typography>
                  <Typography variant='h6' className='font-bold mb-2 truncate' style={{ color: '#047857' }}>
                    {p.name}
                  </Typography>
                  <Typography variant='body2' className='mb-4 line-clamp-2' style={{ color: '#4b5563' }}>
                    {p.description}
                  </Typography>
                  <div className='mt-auto mb-4'>
                    <Typography variant='h6' className='font-bold' style={{ color: '#059669' }}>
                      {hasOfferDiscount(p) && (
                        <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.85em' }}>
                          ₹{p.price}
                        </span>
                      )}
                      ₹{effectivePrice(p)} {p.isGemstone ? '/ Carat' : ''}
                    </Typography>
                    {gstLabel(p) && (
                      <Typography variant='caption' style={{ color: '#6b7280' }}>
                        {gstLabel(p)}
                      </Typography>
                    )}
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Button
                      component={Link}
                      href={`/front-pages/ecommerce/${p.id}`}
                      variant='outlined'
                      fullWidth
                      className='font-semibold'
                      style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}
                    >
                      View Details
                    </Button>
                    <div className='flex gap-2'>
                      <Button
                        variant='contained'
                        fullWidth
                        onClick={() => handleAddToCart(p)}
                        className='galaxy-glow-btn font-bold'
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant='contained'
                        fullWidth
                        onClick={() => handleOpenBooking(p)}
                        className='galaxy-glow-btn font-bold'
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Purchase Form Dialog */}
        <Dialog 
          open={bookingOpen} 
          onClose={handleClose}
          PaperProps={{
            className: 'galaxy-card max-w-lg w-full p-4',
            style: { border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px' }
          }}
        >
          <DialogTitle className='font-bold text-xl galaxy-glow-text pb-4' style={{ color: '#059669', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
            Configure Purchase - {selectedProduct?.name}
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent className='py-6 flex flex-col gap-5'>
              {success ? (
                <Alert severity='success'>
                  Product configured! Item added to your cart for checkout.
                </Alert>
              ) : (
                <>
                  {selectedProduct?.isGemstone && (
                    <Box className='mb-4'>
                      <Typography sx={{ color: '#374151', text: 'sm', fontWeight: 'semibold', mb: 3 }}>
                        Select Carat Size: {carat} Carats
                      </Typography>
                      <Slider
                        value={carat}
                        min={3.5}
                        max={12.5}
                        step={0.5}
                        onChange={(_, val) => setCarat(val as number)}
                        valueLabelDisplay='auto'
                        sx={{
                          color: '#10b981',
                          '& .MuiSlider-thumb': { border: '2px solid white' }
                        }}
                      />
                    </Box>
                  )}

                  <TextField
                    required
                    label='Quantity'
                    type='number'
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#6b7280' },
                      '& .MuiOutlinedInput-root': {
                        color: '#0f172a',
                        '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                        '&:hover fieldset': { borderColor: '#10b981' }
                      }
                    }}
                  />

                  <TextField
                    required
                    label='Shipping Address'
                    placeholder='House No, Street, Landmark, Pin code'
                    multiline
                    rows={3}
                    fullWidth
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#6b7280' },
                      '& .MuiOutlinedInput-root': {
                        color: '#0f172a',
                        '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                        '&:hover fieldset': { borderColor: '#10b981' }
                      }
                    }}
                  />

                  <Box className='flex justify-between items-center p-4 rounded-lg mt-2' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Typography className='font-semibold' style={{ color: '#374151' }}>Total Payable Amount:</Typography>
                    <Typography className='text-2xl font-bold' style={{ color: '#059669' }}>₹{getPrice()}</Typography>
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions className='pt-4 px-6' style={{ borderTop: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <Button onClick={handleClose} className='font-bold' style={{ color: '#6b7280' }}>
                {success ? 'Close' : 'Cancel'}
              </Button>
              {!success && (
                <Button type='submit' className='galaxy-glow-btn font-bold px-6'>
                  Add to Cart & Buy
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>

        {/* FAQ Section */}
        <HowItWorksSection page='ecommerce' items={DEFAULT_HOW_IT_WORKS_STEPS} />

        <ServiceFaq
          page="ecommerce"
          title="Remedial Store FAQ"
          subtitle="Frequently asked questions about our certified gemstones and energized items."
          items={[
            {
              question: "Are your gemstones and rudrakshas certified?",
              answer: "Yes, every gemstone and rudraksha bead sold on Mandir Setu is accompanied by an authenticity certificate from government-approved independent gemological laboratories."
            },
            {
              question: "What does it mean for an item to be 'energized'?",
              answer: "Before dispatch, each item undergoes customized Vedic mantra purification and activation rituals conducted by verified pandits aligned with the item's ruling deity or astrological planet."
            },
            {
              question: "What is your return and exchange policy?",
              answer: "We offer a 7-day hassle-free return and exchange policy on all products, provided they are in their original packaging and have not been damaged or altered."
            },
            {
              question: "How is the carat size for gemstones calculated?",
              answer: "You can use our interactive slider on the product checkout to choose custom sizes (3.5 to 12.5 carats). Prices scale dynamically based on the exact weight selected."
            }
          ]}
        />
      </div>
    </div>
  )
}

export default EcommercePage
