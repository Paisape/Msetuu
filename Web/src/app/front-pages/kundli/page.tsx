'use client'

import { useState, useEffect } from 'react'

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
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import PageBanner from '@/components/PageBanner'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type KundliType = Priced & {
  id: string
  title: string
  description: string
  delivery: string
  image: string
}

// Fallback used only if the database has no Kundli listings yet (e.g. before seeding).
const FALLBACK_TYPES: KundliType[] = [
  {
    id: 'k1',
    title: 'Premium Janam Kundli',
    delivery: 'Physical Hardcopy + PDF Scans',
    price: 1501,
    description: 'Comprehensive 80+ page handcrafted horoscope notebook detailed by certified pandits mapping major periods and remedies.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'k2',
    title: 'Lagna Patrika & Kundli',
    delivery: 'Special Marriage Match Booklet',
    price: 1101,
    description: 'Lagna birth chart and planetary transitions analysis optimized for marriage alignment and dosha consultations.',
    image: 'https://images.unsplash.com/photo-1609137144813-91147a242f2b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'k3',
    title: 'Varshphal (Annual Progress) Kundli',
    delivery: 'E-Scan PDF + Pocket Printout',
    price: 851,
    description: 'Focused solar return analysis mapping the next 12 months of health, finance, and career progressions.',
    image: 'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?auto=format&fit=crop&q=80&w=400'
  }
]

const KundliPage = () => {
  const searchParams = useSearchParams()
  const bookId = searchParams.get('book')
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<KundliType | null>(null)
  const [types, setTypes] = useState<KundliType[]>(FALLBACK_TYPES)

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    timeOfBirth: '',
    birthPlace: '',
    comment: ''
  })

  const [success, setSuccess] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/kundli/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTypes(
            data.map((l: any) => ({
              id: l.id,
              title: l.title,
              delivery: l.delivery,
              price: l.price,
              offerPrice: l.offerPrice,
              gstPercentage: l.gstPercentage,
              gstInclusive: l.gstInclusive,
              description: l.description,
              image: l.image
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback types on error
      })
  }, [])

  const handleOpen = (item: KundliType) => {
    setSelectedType(item)
    setErrorMsg(null)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSuccess(false)
    setErrorMsg(null)
  }

  // "Order Now" on the detail page (/front-pages/kundli/[id]) links back here with
  // ?book=<listingId> so the same booking dialog opens automatically.
  useEffect(() => {
    if (!bookId) return
    const match = types.find(t => t.id === bookId)

    if (match) handleOpen(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, types])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const { loadRazorpayScript, openRazorpayCheckout } = await import('@/libs/razorpayClient')
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment SDK. Check your internet connection.')
      }

      // 2. Create the PENDING order in DB and get Razorpay Order ID
      const response = await fetch('/api/kundli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundliListingId: selectedType?.id,
          kundliType: selectedType?.title,
          ...formData
        })
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to initialize order details.')
      }

      // 3. Open Razorpay Sandbox Checkout overlay
      openRazorpayCheckout({
        key: data.razorpayOrder.key,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'Mandir Setu',
        description: `Order Kundli — ${selectedType?.title}`,
        order_id: data.razorpayOrder.id,
        prefill: {
          name: formData.name
        },
        handler: async function (paymentResponse) {
          try {
            setLoading(true)


            // 4. Verify payment signature on the server
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderType: 'KUNDLI',
                orderId: data.order.id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySignature: paymentResponse.razorpay_signature
              })
            })

            const verifyData = await verifyRes.json().catch(() => null)

            if (!verifyRes.ok) {
              throw new Error(verifyData?.error || 'Payment signature verification failed.')
            }

            setSuccess(true)
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Signature verification failed.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          }
        }
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during payment.')
      setLoading(false)
    }
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Banner */}
        <PageBanner
          page='kundli'
          defaultTitle='Handcrafted Janam Kundli'
          defaultSubtitle='Get authentic, hand-drawn birth charts prepared by renowned Pandits. Includes detailed lifetime analysis, doshas, and remedies.'
        />

        {/* Listings Grid */}
        <Grid container spacing={6}>
          {types.map((item) => (
            <Grid size={{ xs: 12, sm: 4, md: 4 }} key={item.id}>
              <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden relative'>
                <div>
                  <div className='relative h-60 w-full overflow-hidden'>
                    <img src={item.image} alt={item.title} className='w-full h-full object-cover' />
                    <div className='absolute bottom-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                      {item.delivery}
                    </div>
                  </div>
                  <CardContent className='p-6'>
                    <Typography variant='h5' className='font-bold mb-3' style={{ color: '#006241' }}>
                      {item.title}
                    </Typography>
                    <Typography variant='body2' style={{ color: '#4b5563' }} className='leading-relaxed'>
                      {item.description}
                    </Typography>
                  </CardContent>
                </div>
                <CardContent className='p-6 pt-0 mt-auto border-t flex justify-between items-center' style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                  <div>
                    <span className='text-xl font-bold' style={{ color: '#006241' }}>
                      {hasOfferDiscount(item) && (
                        <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.75em' }}>
                          ₹{item.price}
                        </span>
                      )}
                      ₹{effectivePrice(item)}
                    </span>
                    {gstLabel(item) && (
                      <Typography variant='caption' className='block' style={{ color: '#6b7280' }}>
                        {gstLabel(item)}
                      </Typography>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      component={Link}
                      href={`/front-pages/kundli/${item.id}`}
                      variant='outlined'
                      className='font-semibold'
                      style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#006241' }}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleOpen(item)}
                      className='galaxy-glow-btn font-bold px-6'
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Booking Dialog */}
        <Dialog
          open={open}
          onClose={handleClose}
          PaperProps={{
            className: 'galaxy-card max-w-lg w-full p-4',
            style: { border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px' }
          }}
        >
          <DialogTitle className='font-bold text-xl galaxy-glow-text pb-4' style={{ color: '#006241', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
            Order {selectedType?.title}
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent className='py-6 flex flex-col gap-5'>
              {success ? (
                <Alert severity='success'>
                  Janam Kundli Order Placed! We will share details with Pandit ji. A scan copy PDF and courier tracking number will be shared soon.
                </Alert>
              ) : (
                <>
                  {errorMsg && <Alert severity='error'>{errorMsg}</Alert>}
                  <TextField
                    required
                    label='Person Name'
                    variant='outlined'
                    fullWidth
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    select
                    label='Gender'
                    fullWidth
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#6b7280' },
                      '& .MuiOutlinedInput-root': {
                        color: '#0f172a',
                        '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                        '&:hover fieldset': { borderColor: '#10b981' }
                      }
                    }}
                  >
                    <MenuItem value='Male'>Male</MenuItem>
                    <MenuItem value='Female'>Female</MenuItem>
                    <MenuItem value='Other'>Other</MenuItem>
                  </TextField>

                  <TextField
                    required
                    label='Date of Birth'
                    type='date'
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
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
                    label='Time of Birth'
                    type='time'
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.timeOfBirth}
                    onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
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
                    label='Birth Place'
                    placeholder='City, State, Country'
                    fullWidth
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
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
                    label='Special Requirement'
                    placeholder='Specific questions on health, career, or matching'
                    multiline
                    rows={3}
                    fullWidth
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
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
                    <Typography className='text-2xl font-bold' style={{ color: '#006241' }}>
                      ₹{selectedType ? effectivePrice(selectedType) : 0}
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions className='pt-4 px-6' style={{ borderTop: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <Button onClick={handleClose} disabled={loading} className='font-bold' style={{ color: '#6b7280' }}>
                {success ? 'Close' : 'Cancel'}
              </Button>
              {!success && (
                <Button type='submit' disabled={loading} className='galaxy-glow-btn font-bold px-6'>
                  {loading ? 'Processing Payment...' : 'Pay & Order Kundli'}
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>

        {/* FAQ Section */}
        <HowItWorksSection page='kundli' items={DEFAULT_HOW_IT_WORKS_STEPS} />

        <ServiceFaq
          page="kundli"
          title="Handcrafted Janam Kundli FAQ"
          subtitle="Frequently asked questions about ordering and receiving your handcrafted birth chart."
          items={[
            {
              question: "How are the Janam Kundlis prepared?",
              answer: "All Janam Kundlis are hand-drawn, calculated, and customized by senior certified Vedic scholars, mapping planets' placements, transit charts, periods (dasha), and remedies. They are not automated software printouts."
            },
            {
              question: "What languages is the Kundli book available in?",
              answer: "Currently, our customized birth chart notebooks are available in Hindi, English, and Sanskrit. You can choose your preferred language while checking out."
            },
            {
              question: "Is a digital copy included in the price?",
              answer: "Yes. Once the physical notebook is completed and blessed, we create a high-quality PDF scan of the book and email it to you. The physical booklet is then dispatched via premium courier."
            },
            {
              question: "How long does it take to prepare and deliver?",
              answer: "Because each Kundli notebook is hand-written by a Pandit, it takes 3-5 days to prepare and energize. Shipping usually takes an additional 3-5 working days depending on your location."
            }
          ]}
        />
      </div>
    </div>
  )
}

export default KundliPage
