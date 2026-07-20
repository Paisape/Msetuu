'use client'

import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

type OfferData = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  headerImage: string
  details: string
  pricingType: string // FLAT, PER_PERSON, PACKAGE
  salePrice: number
  offerPrice: number
  packages: any[] | null
  gstPercentage: number
  gstInclusive: boolean
}

type Devotee = {
  name: string
  gotra: string
}

export default function OfferLandingPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [offer, setOffer] = useState<OfferData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Package & Devotees checkout choices
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [devotees, setDevotees] = useState<Devotee[]>([{ name: '', gotra: '' }])

  // Booking Form Modal State
  const [bookingOpen, setBookingOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  })

  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Load offer details & log visit
  useEffect(() => {
    if (!slug) return

    const loadOffer = async () => {
      try {
        const res = await fetch(`/api/offer/${slug}`)

        if (!res.ok) {
          const data = await res.json().catch(() => null)

          throw new Error(data?.error || 'Offer not found.')
        }

        const data = await res.json()

        setOffer(data)

        // Pre-select first package if PACKAGE mode
        if (data.pricingType === 'PACKAGE' && data.packages && data.packages.length > 0) {
          setSelectedPackage(data.packages[0].name)
        }

        // Log visit in background
        fetch(`/api/offer/${slug}`, { method: 'POST' }).catch(err =>
          console.error('[visit] Failed to log visit:', err)
        )
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load special offer.')
      } finally {
        setLoading(false)
      }
    }

    loadOffer()
  }, [slug])

  // Price calculations based on selection
  const getSelectedPrice = () => {
    if (!offer) return { sale: 0, offer: 0 }

    if (offer.pricingType === 'PACKAGE') {
      const matched = (offer.packages || []).find(p => p.name === selectedPackage)

      
return {
        sale: matched?.salePrice || offer.salePrice,
        offer: matched?.offerPrice || offer.offerPrice
      }
    }

    if (offer.pricingType === 'PER_PERSON') {
      const count = devotees.length

      
return {
        sale: offer.salePrice * count,
        offer: offer.offerPrice * count
      }
    }

    
return { sale: offer.salePrice, offer: offer.offerPrice }
  };

  const handleOpenBooking = () => {
    setBookingOpen(true)
    setBookingSuccess(false)
    setBookingError(null)

    // Pre-populate booking main name with lead devotee name if filled
    if (offer?.pricingType === 'PER_PERSON' && devotees[0]?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: devotees[0].name }))
    }
  }

  const handleCloseBooking = () => {
    if (bookingSubmitting) return
    setBookingOpen(false)
  }

  // Devotee row controls
  const handleAddDevotee = () => {
    setDevotees([...devotees, { name: '', gotra: '' }])
  }

  const handleRemoveDevotee = (index: number) => {
    setDevotees(devotees.filter((_, idx) => idx !== index))
  }

  const handleDevoteeChange = (index: number, field: keyof Devotee, value: string) => {
    const updated = [...devotees]

    updated[index][field] = value
    setDevotees(updated)

    // Auto-update lead name field if updating the first devotee's name
    if (index === 0 && field === 'name') {
      setFormData(prev => ({ ...prev, name: value }))
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingSubmitting(true)
    setBookingError(null)

    // Devotees validation for PER_PERSON mode
    if (offer?.pricingType === 'PER_PERSON') {
      const missing = devotees.some(d => !d.name.trim())

      if (missing) {
        setBookingError('Please enter devotee names for all rows.')
        setBookingSubmitting(false)
        
return
      }
    }

    try {
      // 1. Load Razorpay script
      const { loadRazorpayScript } = await import('@/libs/razorpayClient')
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment SDK. Check your internet connection.')
      }

      // 2. Mint pending order and get razorpay order parameters
      const orderPayload = {
        ...formData,
        packageName: offer?.pricingType === 'PACKAGE' ? selectedPackage : undefined,
        devotees: offer?.pricingType === 'PER_PERSON' ? devotees : undefined
      }

      const orderRes = await fetch(`/api/offer/${slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      const orderData = await orderRes.json().catch(() => null)

      if (!orderRes.ok) {
        throw new Error(orderData?.error || 'Failed to initialize booking order.')
      }

      const { order, razorpayOrder } = orderData

      // 3. Launch Razorpay Sandbox Checkout popup
      const { openRazorpayCheckout } = await import('@/libs/razorpayClient')

      await new Promise<void>((resolve, reject) => {
        openRazorpayCheckout({
          key: razorpayOrder.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Mandir Setu Promotion',
          description: `Payment for ${offer?.title}`,
          order_id: razorpayOrder.id,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
          },
          handler: async function (paymentResponse: any) {
            try {
              // 4. Verify payment signature on backend
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderType: 'OFFER',
                  orderId: order.id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpaySignature: paymentResponse.razorpay_signature
                })
              })

              const verifyData = await verifyRes.json().catch(() => null)

              if (!verifyRes.ok) {
                reject(new Error(verifyData?.error || 'Payment signature verification failed.'))
              } else {
                resolve()
              }
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled by customer.'))
            }
          }
        })
      })

      setBookingSuccess(true)
      setFormData({ name: '', email: '', phone: '', comment: '' })
      setDevotees([{ name: '', gotra: '' }])
    } catch (err: any) {
      setBookingError(err.message || 'Payment processing failed.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box className='galaxy-bg stars-overlay min-h-screen flex items-center justify-center'>
        <CircularProgress style={{ color: '#10b981' }} />
      </Box>
    )
  }

  if (errorMsg || !offer) {
    return (
      <Box className='galaxy-bg stars-overlay min-h-screen py-24 px-6 flex flex-col items-center justify-center text-center'>
        <Card className='galaxy-card max-w-md p-8 border border-emerald-500/20'>
          <Typography variant='h5' className='font-bold mb-4' style={{ color: '#ef4444' }}>
            ⚠️ Offer Unavailable
          </Typography>
          <Typography className='mb-6 text-slate-600'>
            {errorMsg || 'This special promotion is either expired, inactive, or invalid.'}
          </Typography>
          <Button variant='contained' className='galaxy-glow-btn' href='/'>
            Go Back Home
          </Button>
        </Card>
      </Box>
    )
  }

  const activePrices = getSelectedPrice()

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Cover / Header Section */}
        <div className='relative rounded-3xl overflow-hidden mb-12 shadow-xl border border-emerald-500/10' style={{ height: '350px' }}>
          <img src={offer.headerImage} alt={offer.title} className='w-full h-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent' />
          <div className='absolute bottom-8 left-8 right-8'>
            <Typography variant='h3' className='font-bold text-white mb-2 leading-tight drop-shadow-md'>
              {offer.title}
            </Typography>
            {offer.subtitle && (
              <Typography variant='h6' className='text-emerald-300 font-medium drop-shadow-sm'>
                {offer.subtitle}
              </Typography>
            )}
          </div>
        </div>

        {/* Content Section */}
        <Grid container spacing={8}>
          {/* Rich Text Details Left */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card className='galaxy-card p-6 md:p-10 border border-emerald-500/10'>
              <Typography variant='h5' className='font-bold mb-6 galaxy-glow-text pb-3' style={{ color: '#006241', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
                Offer Description & Details
              </Typography>
              <div 
                dangerouslySetInnerHTML={{ __html: offer.details }} 
                className='prose max-w-none text-slate-800 leading-relaxed text-base'
                style={{
                  color: '#334155',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
              />
            </Card>
          </Grid>

          {/* Pricing Card Right */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className='galaxy-card p-6 border border-emerald-500/25 sticky top-24' style={{ background: 'rgba(255,255,255,0.95)' }}>
              <div className='text-center border-b pb-6 mb-6' style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
                <span className='bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full border border-emerald-200 font-bold mb-4 inline-block uppercase tracking-wider'>
                  Limited Time Direct Offer
                </span>

                {/* Render select options for package tiers */}
                {offer.pricingType === 'PACKAGE' && offer.packages && (
                  <Box className='my-4 flex flex-col gap-2.5 text-left'>
                    <Typography variant='caption' className='font-bold text-slate-700 block'>
                      Choose Package Tier:
                    </Typography>
                    {offer.packages.map((pkg: any) => {
                      const isSelected = selectedPackage === pkg.name

                      
return (
                        <Box
                          key={pkg.name}
                          onClick={() => setSelectedPackage(pkg.name)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <Typography className='font-bold text-slate-800 text-sm'>{pkg.name}</Typography>
                            <Typography variant='caption' className='text-slate-400 line-through mr-2'>
                              ₹{pkg.salePrice}
                            </Typography>
                            <Typography variant='caption' className='text-emerald-600 font-bold'>
                              ₹{pkg.offerPrice}
                            </Typography>
                          </div>
                          <Box className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <Box className='w-1.5 h-1.5 rounded-full bg-white' />}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}

                {/* Devotees count explanation if PER_PERSON pricing type */}
                {offer.pricingType === 'PER_PERSON' && (
                  <Box className='my-3 p-3 rounded-lg border border-emerald-100 text-left bg-emerald-50/30'>
                    <Typography variant='caption' className='font-bold text-slate-700 block'>
                      Pricing per Devotee:
                    </Typography>
                    <Typography variant='body2' color='textSecondary' className='leading-relaxed mt-1'>
                      Each devotee row added will cost <strong className='text-emerald-600'>₹{offer.offerPrice}</strong> (Original: ₹{offer.salePrice}). You can manage devotee names in the checkout.
                    </Typography>
                  </Box>
                )}

                <div className='flex justify-center items-baseline gap-3 mt-4'>
                  <Typography variant='h4' className='line-through text-slate-400 font-semibold'>
                    ₹{activePrices.sale}
                  </Typography>
                  <Typography variant='h2' className='font-bold' style={{ color: '#006241' }}>
                    ₹{activePrices.offer}
                  </Typography>
                </div>
                <Typography variant='caption' className='text-slate-500 block mt-1'>
                  {offer.gstInclusive ? '*All Pricing is GST Inclusive' : `*Excludes ${offer.gstPercentage}% GST`}
                </Typography>
              </div>

              <div className='flex flex-col gap-4'>
                <Button
                  onClick={handleOpenBooking}
                  variant='contained'
                  fullWidth
                  size='large'
                  className='galaxy-glow-btn font-bold py-4 text-lg'
                >
                  Book & Secure Offer
                </Button>
                <Typography variant='body2' className='text-slate-500 text-center leading-normal'>
                  🔒 Direct booking. Fully secured via encrypted Razorpay payments interface.
                </Typography>
              </div>
            </Card>
          </Grid>
        </Grid>

        {/* Booking Dialog */}
        <Dialog
          open={bookingOpen}
          onClose={handleCloseBooking}
          disableEscapeKeyDown
          PaperProps={{
            className: 'galaxy-card max-w-lg w-full p-4',
            style: { border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px' }
          }}
        >
          <DialogTitle className='font-bold text-xl galaxy-glow-text pb-4 flex justify-between items-center' style={{ color: '#006241', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
            <span>Secure Your Booking</span>
            <IconButton onClick={handleCloseBooking} size='small' disabled={bookingSubmitting} style={{ color: '#006241' }}>
              <i className='tabler-x text-xl' />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleBookingSubmit}>
            <DialogContent className='py-6 flex flex-col gap-5'>
              {bookingSuccess ? (
                <Alert severity='success' className='py-4'>
                  Congratulations! Your special offer booking has been paid and confirmed. You will receive a receipt via email shortly.
                </Alert>
              ) : (
                <>
                  {bookingError && (
                    <Alert severity='error' className='py-2'>
                      {bookingError}
                    </Alert>
                  )}

                  {/* Devotees List Builder for PER_PERSON pricing */}
                  {offer.pricingType === 'PER_PERSON' && (
                    <Box className='border rounded-xl p-4 bg-slate-50/50 border-slate-200'>
                      <Box className='flex justify-between items-center mb-3'>
                        <Typography variant='subtitle2' className='font-bold text-slate-700'>
                          👥 Devotee Members List
                        </Typography>
                        <Button
                          size='small'
                          variant='outlined'
                          style={{ color: '#006241', borderColor: '#006241' }}
                          startIcon={<i className='tabler-plus' />}
                          onClick={handleAddDevotee}
                          disabled={bookingSubmitting}
                        >
                          Add Devotee
                        </Button>
                      </Box>
                      <Box className='flex flex-col gap-4 max-h-[220px] overflow-y-auto pr-1'>
                        {devotees.map((d, index) => (
                          <Grid container spacing={2} key={index} className='items-center'>
                            <Grid size={{ xs: 6 }}>
                              <TextField
                                size='small'
                                required
                                label={`Name ${index + 1}`}
                                fullWidth
                                disabled={bookingSubmitting}
                                value={d.name}
                                onChange={e => handleDevoteeChange(index, 'name', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 5 }}>
                              <TextField
                                size='small'
                                label='Gotra'
                                fullWidth
                                disabled={bookingSubmitting}
                                value={d.gotra}
                                onChange={e => handleDevoteeChange(index, 'gotra', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 1 }} className='text-center'>
                              {devotees.length > 1 && (
                                <IconButton
                                  size='small'
                                  style={{ color: '#ef4444' }}
                                  disabled={bookingSubmitting}
                                  onClick={() => handleRemoveDevotee(index)}
                                >
                                  <i className='tabler-trash' />
                                </IconButton>
                              )}
                            </Grid>
                          </Grid>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <TextField
                    required
                    label='Lead Contact Name'
                    placeholder='Lead person name'
                    fullWidth
                    disabled={bookingSubmitting}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                    type='email'
                    label='Email Address'
                    placeholder='yourname@example.com'
                    fullWidth
                    disabled={bookingSubmitting}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                    label='Contact Phone Number'
                    placeholder='10-digit mobile number'
                    fullWidth
                    disabled={bookingSubmitting}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
                    label={offer.pricingType === 'PER_PERSON' ? 'Custom Comments' : 'Gotra / Custom Instructions'}
                    placeholder='Enter gotra details or accommodation requests if any'
                    multiline
                    rows={2}
                    fullWidth
                    disabled={bookingSubmitting}
                    value={formData.comment}
                    onChange={e => setFormData({ ...formData, comment: e.target.value })}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#6b7280' },
                      '& .MuiOutlinedInput-root': {
                        color: '#0f172a',
                        '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                        '&:hover fieldset': { borderColor: '#10b981' }
                      }
                    }}
                  />

                  <Box className='p-4 rounded-xl mt-2 flex justify-between items-center' style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <Typography className='font-semibold text-slate-700'>
                      Total Amount Payable:
                    </Typography>
                    <Typography variant='h5' className='font-bold' style={{ color: '#006241' }}>
                      ₹{activePrices.offer}
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions className='pt-2 pb-4 px-6' style={{ borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <Button onClick={handleCloseBooking} disabled={bookingSubmitting} style={{ color: '#6b7280' }}>
                {bookingSuccess ? 'Close' : 'Cancel'}
              </Button>
              {!bookingSuccess && (
                <Button
                  type='submit'
                  disabled={bookingSubmitting}
                  className='galaxy-glow-btn font-bold px-6 py-2.5'
                >
                  {bookingSubmitting ? 'Processing Payment...' : 'Proceed to Checkout'}
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>
      </div>
    </div>
  )
}
