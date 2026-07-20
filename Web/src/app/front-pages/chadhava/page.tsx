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
import IconButton from '@mui/material/IconButton'

import { useCart } from '@/contexts/CartContext'
import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import PageBanner from '@/components/PageBanner'
import { effectivePrice, hasOfferDiscount, gstLabel } from '@/libs/pricing'

type ChadhavaItem = {
  id: string
  title: string
  temple: string
  description: string
  price: number
  offerPrice?: number | null
  gstPercentage?: number | null
  gstInclusive?: boolean
  image: string
}

// Fallback used only if the database has no Chadhava listings yet (e.g. before seeding).
const FALLBACK_LISTINGS: ChadhavaItem[] = [
  {
    id: 'c1',
    title: 'Maha Shringar & Aarti Chadhava',
    temple: 'Kashi Vishwanath Temple, Varanasi',
    description: 'Offer a complete shringar puja to Lord Shiva with flowers, bilva patra, and special bhog.',
    price: 1101,
    image: '/images/devotional/kashi.jpg'
  },
  {
    id: 'c2',
    title: 'Sindoor Archana & Durva Chadhava',
    temple: 'Siddhivinayak Temple, Mumbai',
    description: 'Perform Sindoor Archana to Lord Ganesha for removing all obstacles from your life path.',
    price: 501,
    image: '/images/devotional/siddhivinayak.jpg'
  },
  {
    id: 'c3',
    title: 'Panchamrit Abhishek Chadhava',
    temple: 'Mahakaleshwar Jyotirlinga, Ujjain',
    description: 'Sacred milk, honey, ghee, sugar and curd offering performed on your behalf by temple priests.',
    price: 2101,
    image: '/images/devotional/mahakaleshwar.jpg'
  },
  {
    id: 'c4',
    title: 'Maha Bhog & Prasad Offering',
    temple: 'Banke Bihari Temple, Vrindavan',
    description: 'Laddoo and peda offering to Lord Krishna. Prasad delivered to your doorstep.',
    price: 851,
    image: '/images/devotional/rammandir.jpg'
  }
]

const ChadhavaPage = () => {
  const { addToCart } = useCart()
  const searchParams = useSearchParams()
  const bookId = searchParams.get('book')

  // States
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedChadhava, setSelectedChadhava] = useState<ChadhavaItem | null>(null)
  const [listings, setListings] = useState<ChadhavaItem[]>(FALLBACK_LISTINGS)

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    birthPlace: '',
    comment: ''
  })


  // Chadhava pricing is per person — every person offered under this booking needs their own
  // name + gotra, and the total charged is (per-person price x number of persons).
  const [persons, setPersons] = useState<{ name: string; gotra: string }[]>([{ name: '', gotra: '' }])
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/chadhava/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setListings(
            data.map((l: any) => ({
              id: l.id,
              title: l.title,
              temple: l.location || l.title,
              description: l.description,
              price: l.price,
              offerPrice: l.offerPrice,
              gstPercentage: l.gstPercentage,
              gstInclusive: l.gstInclusive,
              image: l.image
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback listings on error
      })
  }, [])

  const handleOpenBooking = (item: ChadhavaItem) => {
    setSelectedChadhava(item)

    // Person 1 auto-fills from whatever Devotee Name is already entered, if anything.
    setPersons([{ name: formData.name, gotra: '' }])
    setBookingOpen(true)
  }

  const handleClose = () => {
    setBookingOpen(false)
    setSuccess(false)
  }

  // "Book Now" on the detail page (/front-pages/chadhava/[id]) links back here with
  // ?book=<listingId> so the exact same booking dialog/flow opens automatically.
  useEffect(() => {
    if (!bookId) return
    const match = listings.find(l => l.id === bookId)

    if (match) handleOpenBooking(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, listings])

  const MAX_PERSONS = 20
  const addPersonRow = () => setPersons(prev => (prev.length >= MAX_PERSONS ? prev : [...prev, { name: '', gotra: '' }]))
  const removePersonRow = (idx: number) => setPersons(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))

  const updatePersonRow = (idx: number, field: 'name' | 'gotra', value: string) =>
    setPersons(prev => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChadhava) return

    const validPersons = persons.filter(p => p.name.trim() && p.gotra.trim())
    const personCount = Math.max(validPersons.length, 1)

    // Add configured item to cart — price is per-person price x number of persons offered.
    addToCart({
      id: selectedChadhava.id,
      name: `${selectedChadhava.title} (${selectedChadhava.temple})`,
      price: effectivePrice(selectedChadhava) * personCount,
      image: selectedChadhava.image,
      type: 'chadhava',
      orderPayload: { chadhavaListingId: selectedChadhava.id },
      details: { ...formData, persons: validPersons, personCount }
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
          page='chadhava'
          defaultTitle='Sacred Chadhava Offerings'
          defaultSubtitle='Offer holy Chadhava at historical Indian temples. Receive digital proof (video and images) and home delivery of Prasad.'
        />

        {/* Listings Grid - small vertical cards (3 per row) */}
        <Grid container spacing={6}>
          {listings.map((item) => (
            <Grid size={{ xs: 12, sm: 4, md: 4 }} key={item.id}>
              <Card className='galaxy-card flex flex-col justify-between overflow-hidden h-full relative'>
                <div className='relative h-48 w-full overflow-hidden'>
                  <img src={item.image} alt={item.title} className='w-full h-full object-cover' />
                </div>
                <CardContent className='p-5 flex flex-col flex-1'>
                  <Typography variant='subtitle2' className='font-semibold mb-1 truncate' style={{ color: '#10b981' }}>
                    📍 {item.temple}
                  </Typography>
                  <Typography variant='h6' className='font-bold mb-3 truncate' style={{ color: '#047857' }}>
                    {item.title}
                  </Typography>
                  <Typography variant='body2' className='mb-4 line-clamp-2' style={{ color: '#4b5563' }}>
                    {item.description}
                  </Typography>
                  <div className='mt-auto mb-4'>
                    <Typography variant='h6' className='font-bold' style={{ color: '#006241' }}>
                      {hasOfferDiscount(item) && (
                        <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.85em' }}>
                          ₹{item.price}
                        </span>
                      )}
                      ₹{effectivePrice(item)}
                    </Typography>
                    {gstLabel(item) && (
                      <Typography variant='caption' style={{ color: '#6b7280' }}>
                        {gstLabel(item)}
                      </Typography>
                    )}
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Button
                      component={Link}
                      href={`/front-pages/chadhava/${item.id}`}
                      variant='outlined'
                      fullWidth
                      className='font-semibold'
                      style={{ borderColor: 'rgba(249,115,22,0.5)', color: '#006241' }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant='contained'
                      fullWidth
                      onClick={() => handleOpenBooking(item)}
                      className='galaxy-glow-btn font-bold'
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Booking & Details Entry Dialog */}
        <Dialog 
          open={bookingOpen} 
          onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
              handleClose()
            }
          }}
          disableEscapeKeyDown
          PaperProps={{
            className: 'galaxy-card max-w-lg w-full p-4',
            style: { border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px' }
          }}
        >
          <DialogTitle className='font-bold text-xl galaxy-glow-text pb-4 flex justify-between items-center' style={{ color: '#006241', borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
            <span>Devotee Details - {selectedChadhava?.title}</span>
            <IconButton onClick={handleClose} size='small' style={{ color: '#006241' }}>
              <i className='tabler-x text-xl' />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent className='py-6 flex flex-col gap-5'>
              {success ? (
                <Alert severity='success'>
                  Chadhava details configured! Item added to your cart for checkout.
                </Alert>
              ) : (
                <>
                  <TextField
                    required
                    label='Devotee Name'
                    variant='outlined'
                    fullWidth
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value

                      setFormData({ ...formData, name: newName })

                      // Auto-fill Person 1's name so it doesn't have to be typed twice — still
                      // editable separately in the person list below if it should differ.
                      setPersons(prev => prev.map((p, i) => (i === 0 ? { ...p, name: newName } : p)))
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { color: '#6b7280' },
                      '& .MuiOutlinedInput-root': {
                        color: '#0f172a',
                        '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                        '&:hover fieldset': { borderColor: '#10b981' },
                        '&.Mui-focused fieldset': { borderColor: '#006241' }
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
                        '&:hover fieldset': { borderColor: '#10b981' },
                        '&.Mui-focused fieldset': { borderColor: '#006241' }
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
                    label='Birth Place'
                    placeholder='City, State'
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
                    label='Special Request / Gotra Details'
                    placeholder='Provide gotra or write a comment'
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

                  <Box>
                    <Typography variant='subtitle2' className='font-semibold mb-2' style={{ color: '#374151' }}>
                      Persons for this Chadhava — price is charged per person
                    </Typography>
                    <div className='flex flex-col gap-3'>
                      {persons.map((p, idx) => (
                        <div key={idx} className='flex gap-2 items-start'>
                          <TextField
                            required
                            size='small'
                            label={`Person ${idx + 1} Name`}
                            fullWidth
                            value={p.name}
                            onChange={(e) => updatePersonRow(idx, 'name', e.target.value)}
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
                            size='small'
                            label='Gotra'
                            fullWidth
                            value={p.gotra}
                            onChange={(e) => updatePersonRow(idx, 'gotra', e.target.value)}
                            sx={{
                              '& .MuiInputLabel-root': { color: '#6b7280' },
                              '& .MuiOutlinedInput-root': {
                                color: '#0f172a',
                                '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                '&:hover fieldset': { borderColor: '#10b981' }
                              }
                            }}
                          />
                          {persons.length > 1 && (
                            <IconButton size='small' onClick={() => removePersonRow(idx)} aria-label='Remove person' sx={{ mt: 0.5 }}>
                              <i className='tabler-x' style={{ fontSize: '16px', color: '#ef4444' }} />
                            </IconButton>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button size='small' onClick={addPersonRow} startIcon={<i className='tabler-plus' />} className='mt-2 font-semibold' style={{ color: '#006241' }}>
                      Add Another Person
                    </Button>
                  </Box>

                  <Box className='flex justify-between items-center p-4 rounded-lg mt-2' style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Typography className='font-semibold' style={{ color: '#374151' }}>
                      Price ({Math.max(persons.filter(p => p.name.trim() && p.gotra.trim()).length, 1)} person{Math.max(persons.filter(p => p.name.trim() && p.gotra.trim()).length, 1) > 1 ? 's' : ''}):
                    </Typography>
                    <div className='text-right'>
                      <Typography className='text-2xl font-bold' style={{ color: '#006241' }}>
                        {selectedChadhava && hasOfferDiscount(selectedChadhava) && (
                          <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.7em' }}>
                            ₹{selectedChadhava.price * Math.max(persons.filter(p => p.name.trim() && p.gotra.trim()).length, 1)}
                          </span>
                        )}
                        ₹{selectedChadhava ? effectivePrice(selectedChadhava) * Math.max(persons.filter(p => p.name.trim() && p.gotra.trim()).length, 1) : 0}
                      </Typography>
                      {selectedChadhava && gstLabel(selectedChadhava) && (
                        <Typography variant='caption' style={{ color: '#6b7280' }}>
                          {gstLabel(selectedChadhava)}
                        </Typography>
                      )}
                    </div>
                  </Box>
                </>
              )}
            </DialogContent>

            <DialogActions className='pt-4 px-6' style={{ borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <Button onClick={handleClose} className='font-bold' style={{ color: '#6b7280' }}>
                {success ? 'Close' : 'Cancel'}
              </Button>
              {!success && (
                <Button type='submit' className='galaxy-glow-btn font-bold px-6'>
                  Configure & Add to Cart
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>

        {/* FAQ Section */}
        <HowItWorksSection page='chadhava' items={DEFAULT_HOW_IT_WORKS_STEPS} />

        <ServiceFaq
          page="chadhava"
          title="Chadhava Offerings FAQ"
          subtitle="All you need to know about making sacred offerings at holy temples."
          items={[
            {
              question: "How do I know the Chadhava has been offered?",
              answer: "You will receive a personalized video clip of the Pandit chanting your name and gotra while making the offering at the deity's shrine. This is uploaded directly to your admin dashboard within 24-48 hours."
            },
            {
              question: "How long does it take for Prasad to be delivered?",
              answer: "The physical Prasad is packed sanitarily and dispatched within 24 hours of the ritual. It typically reaches your address in 3 to 5 working days depending on your location."
            },
            {
              question: "Can I offer Chadhava on a specific date or festival?",
              answer: "Yes, when configuring your booking, you can select special dates like Amavasya, Purnima, Ekadashi, or local temple festivals to align your offering with auspicious timings."
            },
            {
              question: "What items are included in the Chadhava package?",
              answer: "Each package contains standard bhog (sweets/dry fruits), flowers, sacred threads, and a protective tilak. The specific details vary depending on the temple's tradition."
            }
          ]}
        />
      </div>
    </div>
  )
}

export default ChadhavaPage
