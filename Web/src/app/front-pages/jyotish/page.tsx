'use client'

import { useState, useEffect, useMemo } from 'react'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import { useSession } from 'next-auth/react'

import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import PageBanner from '@/components/PageBanner'
import { effectivePrice, hasOfferDiscount, gstLabel } from '@/libs/pricing'

type JyotishCategory = {
  id: string
  name: string
  price30: number
  offerPrice30?: number | null
  price60: number
  offerPrice60?: number | null
  price90: number
  offerPrice90?: number | null
  gstPercentage?: number | null
  gstInclusive?: boolean
}

// Session-length options — price for each comes from the selected category's matching
// price30/price60/price90 (+ offer) pair, see JyotishCategory above.
const DURATIONS = [
  { mins: 30, label: 'Half Hour' },
  { mins: 60, label: '1 Hour' },
  { mins: 90, label: '1.5 Hours' }
] as const

const fieldSx = {
  '& .MuiInputLabel-root': { color: '#6b7280' },
  '& .MuiOutlinedInput-root': {
    color: '#0f172a',
    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
    '&:hover fieldset': { borderColor: '#006241' },
    '&.Mui-focused fieldset': { borderColor: '#006241' }
  }
}

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  dob: '',
  timeOfBirth: '',
  placeOfBirth: '',
  categoryName: '',
  durationMins: DURATIONS[1].mins as number,
  problem: ''
})

const JyotishPage = () => {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<JyotishCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [formData, setFormData] = useState(emptyForm())
  const [success, setSuccess] = useState(false)
  const [bookedId, setBookedId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/jyotish/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data)
          setFormData(prev => ({ ...prev, categoryName: prev.categoryName || data[0].name }))
        }
      })
      .catch(() => {
        // Empty list — the fee box shows a "not available yet" message and submit stays disabled
      })
      .finally(() => setCategoriesLoading(false))
  }, [])

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || session.user?.name || '',
        email: prev.email || session.user?.email || ''
      }))
    }
  }, [session])

  const category = useMemo(() => categories.find(c => c.name === formData.categoryName) ?? null, [categories, formData.categoryName])

  // Price depends on category AND the chosen duration tier — e.g. Kundli Reading is priced
  // differently at 30/60/90 minutes.
  const priced = useMemo(() => {
    if (!category) return { price: 0, offerPrice: null, gstPercentage: null, gstInclusive: true }

    const tier =
      formData.durationMins === 30
        ? { price: category.price30, offerPrice: category.offerPrice30 }
        : formData.durationMins === 60
          ? { price: category.price60, offerPrice: category.offerPrice60 }
          : { price: category.price90, offerPrice: category.offerPrice90 }

    return { ...tier, gstPercentage: category.gstPercentage, gstInclusive: category.gstInclusive }
  }, [category, formData.durationMins])

  const fee = effectivePrice(priced)
  const problemWordCount = formData.problem.trim() ? formData.problem.trim().split(/\s+/).filter(Boolean).length : 0

  const updateField = (key: keyof ReturnType<typeof emptyForm>, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const updateDuration = (mins: number) => setFormData(prev => ({ ...prev, durationMins: mins }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!category) {
      setErrorMsg('Please select a consultation category to continue.')

      return
    }

    if (problemWordCount < 10) {
      setErrorMsg('Please describe your problem in at least 10 words.')

      return
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setErrorMsg('Please enter a valid 10-digit mobile number.')

      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/jyotish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category.name,
          durationMins: formData.durationMins,
          comment: formData.problem,
          name: formData.name,
          email: formData.email,
          phone: `+91${formData.phone.trim()}`,
          dob: formData.dob,
          timeOfBirth: formData.timeOfBirth,
          placeOfBirth: formData.placeOfBirth
        })
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to book consultation.')
      }

      if (data.razorpayOrder) {
        const { loadRazorpayScript, openRazorpayCheckout } = await import('@/libs/razorpayClient')
        const scriptLoaded = await loadRazorpayScript()

        if (!scriptLoaded) {
          throw new Error('Failed to load Razorpay payment SDK. Check your internet connection.')
        }

        openRazorpayCheckout({
          key: data.razorpayOrder.key,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: 'Mandirsetuu',
          description: 'Jyotish Consultation Booking',
          order_id: data.razorpayOrder.id,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: `+91${formData.phone.trim()}`
          },
          handler: async function (paymentResponse) {
            try {
              setSubmitting(true)

              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderType: 'JYOTISH',
                  orderId: data.booking.id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpaySignature: paymentResponse.razorpay_signature
                })
              })

              const verifyData = await verifyRes.json().catch(() => null)

              if (!verifyRes.ok) {
                throw new Error(verifyData?.error || 'Payment signature verification failed.')
              }

              setBookedId(data.booking.id)
              setSuccess(true)
              setFormData(emptyForm())
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Signature verification failed.')
            } finally {
              setSubmitting(false)
            }
          },
          modal: {
            ondismiss: () => setSubmitting(false)
          }
        })
      } else {
        setBookedId(data.booking.id)
        setSuccess(true)
        setFormData(emptyForm())
        setSubmitting(false)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during booking.')
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen py-24 px-6' style={{ background: '#f8fafc' }}>
      <div className='max-w-3xl mx-auto'>
        <PageBanner
          page='jyotish'
          defaultTitle='Jyotish Astrology Consultation'
          defaultSubtitle="Get immediate answers to life's uncertainties. Book a personal consultation with our verified Vedic Astrologers."
        />

        <Card className='p-6 md:p-10 border border-slate-200/60'>
          {success ? (
            <Alert severity='success'>
              Your consultation request has been booked successfully! <strong>Booking ID: {bookedId}</strong>.
              A confirmation email with your booking details has been sent to you. Our astrologer will connect with
              you shortly.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Typography variant='h5' className='font-bold mb-1' style={{ color: '#047857' }}>
                Book Your Consultation
              </Typography>
              <Typography variant='body2' className='mb-6' style={{ color: '#6b7280' }}>
                Fill in your details below — our astrologer will get in touch with you after payment.
              </Typography>

              {errorMsg && (
                <Alert severity='error' className='mb-6'>
                  {errorMsg}
                </Alert>
              )}

              {/* SECTION 1: Personal Details */}
              <Box className='mb-6 p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#006241' }}>
                  <i className='tabler-user' /> 1. Devotee Details
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      required
                      label='Full Name'
                      fullWidth
                      value={formData.name}
                      onChange={e => updateField('name', e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      required
                      type='email'
                      label='Email'
                      fullWidth
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      required
                      label='Mobile Number'
                      fullWidth
                      value={formData.phone}
                      onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      InputProps={{ startAdornment: <InputAdornment position='start'>+91</InputAdornment> }}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 2: Birth Details */}
              <Box className='mb-6 p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#006241' }}>
                  <i className='tabler-moon-stars' /> 2. Horoscope & Birth Details
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      required
                      label='Date of Birth'
                      type='date'
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={formData.dob}
                      onChange={e => updateField('dob', e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      required
                      label='Time of Birth'
                      type='time'
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={formData.timeOfBirth}
                      onChange={e => updateField('timeOfBirth', e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      required
                      label='Place of Birth'
                      fullWidth
                      placeholder='City, State'
                      value={formData.placeOfBirth}
                      onChange={e => updateField('placeOfBirth', e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 3: Consultation Details */}
              <Box className='mb-6 p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#006241' }}>
                  <i className='tabler-calendar-event' /> 3. Consultation Details
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      select
                      required
                      label='Consultation Category'
                      fullWidth
                      value={formData.categoryName}
                      onChange={e => updateField('categoryName', e.target.value)}
                      sx={fieldSx}
                      disabled={categoriesLoading || categories.length === 0}
                      helperText={
                        categoriesLoading
                          ? 'Loading categories…'
                          : categories.length === 0
                            ? 'No categories are available yet — please check back soon.'
                            : undefined
                      }
                    >
                      {categories.map(c => (
                        <MenuItem key={c.id} value={c.name}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      select
                      required
                      label='Session Duration'
                      fullWidth
                      value={formData.durationMins}
                      onChange={e => updateDuration(Number(e.target.value))}
                      sx={fieldSx}
                      disabled={!category}
                    >
                      {DURATIONS.map(d => {
                        const tierPrice = d.mins === 30 ? category?.price30 : d.mins === 60 ? category?.price60 : category?.price90

                        return (
                          <MenuItem key={d.mins} value={d.mins}>
                            {d.label}{category && tierPrice !== undefined ? ` — ₹${tierPrice}` : ''}
                          </MenuItem>
                        )
                      })}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      required
                      label='Describe Your Problem'
                      placeholder='Describe what you would like guidance on (minimum 10 words)'
                      multiline
                      rows={4}
                      fullWidth
                      value={formData.problem}
                      onChange={e => updateField('problem', e.target.value)}
                      helperText={`${problemWordCount} word${problemWordCount === 1 ? '' : 's'} (minimum 10 required)`}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                  <Box
                    className='flex justify-between items-center p-4 rounded-lg'
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                  >
                    <Typography className='font-semibold' style={{ color: '#374151' }}>
                      Consultation Fee:
                    </Typography>
                    <div className='text-right'>
                      <Typography className='text-2xl font-bold' style={{ color: '#006241' }}>
                        {hasOfferDiscount(priced) && (
                          <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.7em' }}>
                            ₹{priced.price}
                          </span>
                        )}
                        ₹{fee}
                      </Typography>
                      {gstLabel(priced) && (
                        <Typography variant='caption' style={{ color: '#6b7280' }}>
                          {gstLabel(priced)}
                        </Typography>
                      )}
                    </div>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }} className='flex justify-end'>
                  <Button
                    type='submit'
                    variant='contained'
                    className='font-bold px-8'
                    style={{ textTransform: 'none' }}
                    disabled={submitting || !category}
                  >
                    {submitting ? 'Processing Payment...' : 'Pay & Book Consultation'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
        </Card>

        <div className='mt-16'>
          <HowItWorksSection page='jyotish' items={DEFAULT_HOW_IT_WORKS_STEPS} />

          <ServiceFaq
            page='jyotish'
            title='Jyotish Consultation FAQ'
            subtitle='Frequently asked questions about booking and speaking with our verified astrologers.'
            items={[
              {
                question: 'How do I connect with my Astrologer?',
                answer:
                  'Once your payment is confirmed, our team assigns the right astrologer for your category and connects with you via voice call, WhatsApp, or Google Meet. Details are shared via email.'
              },
              {
                question: 'Can I get a written summary report after the call?',
                answer:
                  'Yes. Within 24 hours of completing your session, the astrologer will share summary notes, key remedies (upay), and recommended gemstones/pujas via email.'
              },
              {
                question: 'Are my personal birth details and discussions private?',
                answer:
                  'Absolutely. We enforce strict confidentiality. Your birth details (date, time, place) and consultation notes are visible only to you and your assigned astrologer.'
              },
              {
                question: 'How is the consultation fee decided?',
                answer:
                  'The fee depends on both your chosen category (e.g. Kundli Reading, Vastu Consultation) and the session duration — Half Hour, 1 Hour, or 1.5 Hours. The exact price for each duration is shown once you select a category above.'
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default JyotishPage
