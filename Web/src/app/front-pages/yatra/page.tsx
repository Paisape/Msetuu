'use client'

import { useState } from 'react'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
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
                      <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#006241' }}>
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
                      <Typography variant='subtitle1' className='font-bold mb-4 flex items-center gap-2' style={{ color: '#006241' }}>
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
