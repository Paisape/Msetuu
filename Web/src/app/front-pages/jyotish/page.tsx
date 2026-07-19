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

type Astrologer = {
  id: string
  name: string
  price30: number
  offerPrice30?: number | null
  gstPercentage?: number | null
  gstInclusive?: boolean
}

type TimeSlot = {
  id: string
  label: string
  startTime: string // 24-hour "HH:mm"
}

// Flat consultation fee shown until the real astrologer list loads (admin manages this via
// Content Management > Astrologers — the first active entry is used as the flat-fee source).
const FALLBACK_ASTROLOGER: Astrologer = { id: '', name: 'Mandirsetuu Astrologer', price30: 999 }

const CATEGORIES = [
  'Love & Relationship',
  'Education & Study',
  'Career & Promotion',
  'Marriage & Matchmaking',
  'Health & Longevity',
  'Wealth & Finance',
  'Legal & Property',
  'Remedies & Vastu',
  'General Guidance'
]

const fieldSx = {
  '& .MuiInputLabel-root': { color: '#6b7280' },
  '& .MuiOutlinedInput-root': {
    color: '#0f172a',
    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
    '&:hover fieldset': { borderColor: '#10b981' },
    '&.Mui-focused fieldset': { borderColor: '#059669' }
  }
}

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  dob: '',
  timeOfBirth: '',
  placeOfBirth: '',
  category: CATEGORIES[0],
  preferredDate: '',
  slotId: '',
  slotTime: '', // fallback free-text datetime, only used while no admin slots are configured yet
  purpose: ''
})

const todayIso = () => new Date().toISOString().slice(0, 10)

const JyotishPage = () => {
  const { data: session } = useSession()
  const [astrologer, setAstrologer] = useState<Astrologer>(FALLBACK_ASTROLOGER)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState(emptyForm())
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/jyotish/astrologers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setAstrologer(data[0])
      })
      .catch(() => {
        // Keep the fallback flat fee on error
      })

    fetch('/api/jyotish/time-slots')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTimeSlots(data)
      })
      .catch(() => {
        // Falls back to a free-form date/time field below when no slots are available
      })
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

  const priced = useMemo(
    () => ({ price: astrologer.price30, offerPrice: astrologer.offerPrice30, gstPercentage: astrologer.gstPercentage, gstInclusive: astrologer.gstInclusive }),
    [astrologer]
  )

  const fee = effectivePrice(priced)
  const purposeWordCount = formData.purpose.trim() ? formData.purpose.trim().split(/\s+/).filter(Boolean).length : 0

  const updateField = (key: keyof ReturnType<typeof emptyForm>, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  // When admin-defined slots exist, the actual booking slotTime is the chosen date combined
  // with that slot's start time; otherwise fall back to the free-text datetime field so booking
  // still works before any slots are configured.
  const resolveSlotTime = (): string | null => {
    if (timeSlots.length > 0) {
      const slot = timeSlots.find(s => s.id === formData.slotId)

      if (!formData.preferredDate || !slot) return null

      const [hours, minutes] = slot.startTime.split(':').map(Number)
      const combined = new Date(`${formData.preferredDate}T00:00:00`)

      combined.setHours(hours, minutes, 0, 0)

      return combined.toISOString()
    }

    return formData.slotTime ? new Date(formData.slotTime).toISOString() : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (purposeWordCount < 10) {
      setErrorMsg('Please describe the purpose of your consultation in at least 10 words.')

      return
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setErrorMsg('Please enter a valid 10-digit mobile number.')

      return
    }

    const resolvedSlotTime = resolveSlotTime()

    if (!resolvedSlotTime) {
      setErrorMsg('Please choose a preferred date and time slot.')

      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/jyotish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astrologerId: astrologer.id || undefined,
          duration: 30,
          category: formData.category,
          slotTime: resolvedSlotTime,
          comment: formData.purpose,
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
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-4xl mx-auto'>
        <PageBanner
          page='jyotish'
          defaultTitle='Jyotish Astrology Consultation'
          defaultSubtitle="Get immediate answers to life's uncertainties. Book a personal consultation with our verified Vedic Astrologers."
        />

        <div className='flex flex-wrap justify-center gap-3 mb-12'>
          {CATEGORIES.map((cat, idx) => (
            <span
              key={idx}
              className='px-4 py-2 rounded-full text-sm font-semibold border'
              style={{ borderColor: 'rgba(16, 185, 129, 0.25)', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}
            >
              {cat}
            </span>
          ))}
        </div>

        <Card className='galaxy-card p-6 md:p-10'>
          {success ? (
            <Alert severity='success'>
              Your consultation request has been booked successfully! A confirmation email with your booking
              details has been sent to you. Our astrologer will connect with you at your preferred slot.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Typography variant='h5' className='font-bold mb-1' style={{ color: '#047857' }}>
                Book Your Consultation
              </Typography>
              <Typography variant='body2' className='mb-6' style={{ color: '#6b7280' }}>
                Fill in your details below and our astrologer will get in touch at your chosen time.
              </Typography>

              {errorMsg && (
                <Alert severity='error' className='mb-6'>
                  {errorMsg}
                </Alert>
              )}

              {/* SECTION 1: Personal Details */}
              <Box className='mb-6 p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#059669' }}>
                  <i className='tabler-user' /> 1. Devotee Details
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 6 }}  >
                    <TextField
                      required
                      label='Full Name'
                      fullWidth
                      value={formData.name}
                      onChange={e => updateField('name', e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}  >
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
                  <Grid size={{ xs: 12 }} >
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
                <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#059669' }}>
                  <i className='tabler-moon-stars' /> 2. Horoscope & Birth Details
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 4 }}  >
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
                  <Grid size={{ xs: 12, sm: 4 }}  >
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
                  <Grid size={{ xs: 12, sm: 4 }}  >
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

              {/* SECTION 3: Consultation settings */}
              <Box className='mb-6 p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#059669' }}>
                  <i className='tabler-calendar-event' /> 3. Consultation Slots
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 6 }}  >
                    <TextField
                      select
                      required
                      label='Purpose Category'
                      fullWidth
                      value={formData.category}
                      onChange={e => updateField('category', e.target.value)}
                      sx={fieldSx}
                    >
                      {CATEGORIES.map(c => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  {timeSlots.length > 0 ? (
                    <>
                      <Grid size={{ xs: 12, sm: 3 }}  >
                        <TextField
                          required
                          label='Preferred Date'
                          type='date'
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: todayIso() }}
                          value={formData.preferredDate}
                          onChange={e => updateField('preferredDate', e.target.value)}
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}  >
                        <TextField
                          select
                          required
                          label='Preferred Time Slot'
                          fullWidth
                          value={formData.slotId}
                          onChange={e => updateField('slotId', e.target.value)}
                          sx={fieldSx}
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </>
                  ) : (
                    <Grid size={{ xs: 12, sm: 6 }}  >
                      <TextField
                        required
                        label='Preferred Date & Time'
                        type='datetime-local'
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.slotTime}
                        onChange={e => updateField('slotTime', e.target.value)}
                        sx={fieldSx}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12 }} >
                    <TextField
                      required
                      label='Describe Your Problem'
                      placeholder='Describe what you would like guidance on (minimum 10 words)'
                      multiline
                      rows={4}
                      fullWidth
                      value={formData.purpose}
                      onChange={e => updateField('purpose', e.target.value)}
                      helperText={`${purposeWordCount} word${purposeWordCount === 1 ? '' : 's'} (minimum 10 required)`}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }} >
                  <Box
                    className='flex justify-between items-center p-4 rounded-lg'
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                  >
                    <Typography className='font-semibold' style={{ color: '#374151' }}>
                      Consultation Fee:
                    </Typography>
                    <div className='text-right'>
                      <Typography className='text-2xl font-bold' style={{ color: '#059669' }}>
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

                <Grid size={{ xs: 12 }}  className='flex justify-end'>
                  <Button type='submit' className='galaxy-glow-btn font-bold px-8' disabled={submitting}>
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
                  'Our astrologer will connect with you via voice call, WhatsApp, or Google Meet at the exact date and time slot you choose during booking. Link/connection details are shared via email.'
              },
              {
                question: 'Can I reschedule my booked consultation?',
                answer:
                  'Yes, you can reschedule your booking free of charge up to 4 hours before the scheduled time slot — just contact support with your booking ID.'
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
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default JyotishPage
