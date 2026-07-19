'use client'

import { useState } from 'react'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import PageBanner from '@/components/PageBanner'

const YatraPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    cityOfDeparture: '',
    destination: 'Char Dham Yatra (Yamunotri, Gangotri, Kedarnath, Badrinath)',
    totalTravelers: 1,
    travelDate: '',
    comment: ''
  })

  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const destinations = [
    'Char Dham Yatra (Yamunotri, Gangotri, Kedarnath, Badrinath)',
    'Do Dham Yatra (Kedarnath & Badrinath)',
    'Kashi Vishwanath & Ayodhya Ram Mandir Tour',
    'Mata Vaishno Devi Devotional Package',
    'Rameshwaram & South India Temples Tour',
    'Dwarkadhish & Somnath Jyotirlinga Yatra'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/yatra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, totalTravelers: Number(formData.totalTravelers) })
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit your Yatra request. Please try again.')
      }

      setSuccess(true)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit your Yatra request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Banner */}
        <PageBanner
          page='yatra'
          defaultTitle='Spiritual Yatra Booking'
          defaultSubtitle='Join our guided, worry-free holy pilgrim yatras with premium transport, accommodations, and VIP temple darshans.'
        />

        {/* Featured Tours Grid */}
        <Typography variant='h4' className='font-bold mb-6 galaxy-glow-text text-center'>
          🌅 Popular Holy Yatra Packages
        </Typography>
        <Grid container spacing={6} className='mb-16'>
          {[
            {
              title: 'Char Dham Yatra',
              duration: '11 Days / 10 Nights',
              desc: 'Sacred trip covering Yamunotri, Gangotri, Kedarnath, and Badrinath shrines with premium transport.',
              image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
              price: '₹28,500/person',
              formVal: 'Char Dham Yatra (Yamunotri, Gangotri, Kedarnath, Badrinath)'
            },
            {
              title: 'Kashi & Ayodhya Tour',
              duration: '6 Days / 5 Nights',
              desc: 'Ganga Aarti boat rides in Varanasi, and VIP Darshans at Ayodhya Ram Mandir and Prayagraj Triveni Sangam.',
              image: 'https://images.unsplash.com/photo-1627664813831-299f2b80a656',
              price: '₹14,999/person',
              formVal: 'Kashi Vishwanath & Ayodhya Ram Mandir Tour'
            },
            {
              title: 'Rameshwaram & South India',
              duration: '8 Days / 7 Nights',
              desc: 'Sacred trip to Rameshwaram Jyotirlinga, Madurai Meenakshi, and Kanyakumari temple shrines.',
              image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
              price: '₹18,200/person',
              formVal: 'Rameshwaram & South India Temples Tour'
            }
          ].map((tour, idx) => (
            <Grid size={{ xs: 12, md: 4 }} key={idx}>
              <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden relative'>
                <div>
                  <div className='relative h-56 w-full overflow-hidden'>
                    <img src={tour.image} alt={tour.title} className='w-full h-full object-cover' />
                    <div className='absolute bottom-4 right-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                      {tour.duration}
                    </div>
                  </div>
                  <CardContent className='p-6'>
                    <Typography variant='h5' className='font-bold mb-3' style={{ color: '#047857' }}>
                      {tour.title}
                    </Typography>
                    <Typography variant='body2' style={{ color: '#4b5563' }} className='leading-relaxed mb-4'>
                      {tour.desc}
                    </Typography>
                  </CardContent>
                </div>
                <CardContent className='p-6 pt-0 mt-auto border-t flex justify-between items-center' style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                  <Typography className='font-bold text-lg' style={{ color: '#059669' }}>
                    {tour.price}
                  </Typography>
                  <Button
                    variant='outlined'
                    size='small'
                    style={{ borderColor: '#10b981', color: '#059669' }}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, destination: tour.formVal }))
                      document.getElementById('yatra-form-card')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Select Package
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Booking Form Card */}
        <Card id='yatra-form-card' className='galaxy-card p-6 md:p-10 max-w-4xl mx-auto'>
          <Typography variant='h5' className='font-bold mb-1' style={{ color: '#047857' }}>
            Register Your Yatra Request
          </Typography>
          <Typography variant='body2' className='mb-6' style={{ color: '#6b7280' }}>
            Fill in your preferences below and our travel coordinator will get in touch with you.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {success ? (
                <Grid size={{ xs: 12 }} >
                  <Alert severity='success'>
                    Yatra Inquiry Submitted! Our travel coordinator will contact you within 24 hours with package itinerary details.
                  </Alert>
                </Grid>
              ) : (
                <>
                  {errorMsg && (
                    <Grid size={{ xs: 12 }} >
                      <Alert severity='error'>{errorMsg}</Alert>
                    </Grid>
                  )}

                  {/* SECTION 1: Contact Details */}
                  <Grid size={{ xs: 12 }} >
                    <Box className='p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                      <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#059669' }}>
                        <i className='tabler-user' /> 1. Contact Information
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6 }}  >
                          <TextField
                            required
                            label='Full Name'
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
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}  >
                          <TextField
                            required
                            label='Contact Number'
                            fullWidth
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#6b7280' },
                              '& .MuiOutlinedInput-root': {
                                color: '#0f172a',
                                '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                '&:hover fieldset': { borderColor: '#10b981' }
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }} >
                          <TextField
                            required
                            label='City of Departure'
                            fullWidth
                            value={formData.cityOfDeparture}
                            onChange={(e) => setFormData({ ...formData, cityOfDeparture: e.target.value })}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#6b7280' },
                              '& .MuiOutlinedInput-root': {
                                color: '#0f172a',
                                '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                '&:hover fieldset': { borderColor: '#10b981' }
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  {/* SECTION 2: Yatra Preference */}
                  <Grid size={{ xs: 12 }} >
                    <Box className='p-4 rounded-xl' style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.15)' }}>
                      <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#059669' }}>
                        <i className='tabler-map-2' /> 2. Pilgrimage Preferences
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12 }} >
                          <TextField
                            select
                            label='Yatra Destination'
                            fullWidth
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#6b7280' },
                              '& .MuiOutlinedInput-root': {
                                color: '#0f172a',
                                '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                '&:hover fieldset': { borderColor: '#10b981' }
                              }
                            }}
                          >
                            {destinations.map((d, idx) => (
                              <MenuItem key={idx} value={d}>{d}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}  >
                          <TextField
                            required
                            label='Total Travelers'
                            type='number'
                            fullWidth
                            InputProps={{ inputProps: { min: 1, max: 50 } }}
                            value={formData.totalTravelers}
                            onChange={(e) => setFormData({ ...formData, totalTravelers: Number(e.target.value) })}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#6b7280' },
                              '& .MuiOutlinedInput-root': {
                                color: '#0f172a',
                                '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                '&:hover fieldset': { borderColor: '#10b981' }
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}  >
                          <TextField
                            required
                            label='Preferred Travel Date'
                            type='date'
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.travelDate}
                            onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#6b7280' },
                              '& .MuiOutlinedInput-root': {
                                color: '#0f172a',
                                '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                '&:hover fieldset': { borderColor: '#10b981' }
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }} >
                          <TextField
                            label='Comments / Special Accommodation Requirements'
                            placeholder='E.g., Senior citizen requirements, wheelchair support, or customized route'
                            multiline
                            rows={4}
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
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}  className='flex justify-end gap-4'>
                    <Button type='submit' disabled={submitting} className='galaxy-glow-btn font-bold px-8 py-3'>
                      {submitting ? 'Submitting...' : 'Submit Booking Request'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </form>
        </Card>

        {/* FAQ Section */}
        <HowItWorksSection page='yatra' items={DEFAULT_HOW_IT_WORKS_STEPS} />

        <ServiceFaq
          page="yatra"
          title="Spiritual Yatra FAQ"
          subtitle="Frequently asked questions about booking and participating in guided pilgrim yatras."
          items={[
            {
              question: "What does the Yatra package include?",
              answer: "Our standard Yatra package covers premium AC travel, comfortable twin-sharing hotel accommodations, pure vegetarian meals (Sattvik), local guided tour support, and VIP temple darshan passes."
            },
            {
              question: "Can we customize our family Yatra package?",
              answer: "Yes, for groups of 6 or more travelers, we can fully customize the itinerary, choice of hotels, departure dates, and transportation options. Contact our support team to plan your custom trip."
            },
            {
              question: "What is the cancellation and refund policy?",
              answer: "We offer a 100% refund for cancellations made at least 15 days prior to departure. A 50% refund is available for cancellations up to 7 days before departure. Cancellations within 7 days are non-refundable."
            },
            {
              question: "Are senior citizen facilities available?",
              answer: "Yes. We pay special attention to senior citizens. We offer priority boarding, ground-floor hotel room allocations, wheelchair assistance, and slow-paced itineraries where requested."
            }
          ]}
        />
      </div>
    </div>
  )
}

export default YatraPage
