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
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import IconButton from '@mui/material/IconButton'

import { useCart } from '@/contexts/CartContext'
import ServiceFaq from '@/components/ServiceFaq'
import HowItWorksSection, { DEFAULT_HOW_IT_WORKS_STEPS } from '@/components/HowItWorksSection'
import PageBanner from '@/components/PageBanner'
import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type PujaPackage = Priced & {
  id: string
  type: string
}

type PujaListing = {
  id: string
  title: string
  description: string
  image: string
  category: string
  packages: PujaPackage[]
}

// Fallback used only if the database has no E-Puja listings yet (e.g. before seeding).
const FALLBACK_LISTINGS: PujaListing[] = [
  {
    id: 'p1',
    title: 'Maha Mrityunjaya Homa',
    category: 'Mahadev',
    description: 'Powerful Vedic ritual dedicated to Lord Shiva to pray for health, longevity, and ward off negative energies.',
    image: '/images/devotional/mahakaleshwar.jpg',
    packages: [
      { id: 'p1-single', type: 'Single', price: 2100 },
      { id: 'p1-couple', type: 'Couple', price: 3500 },
      { id: 'p1-family', type: 'Family', price: 5100 }
    ]
  },
  {
    id: 'p2',
    title: 'Ganesha Atharvashirsha & Abhishek',
    category: 'Ganesha',
    description: 'Performed at ancient Ganesha shrine to receive wisdom, clear business blockages, and get dynamic success.',
    image: '/images/devotional/siddhivinayak.jpg',
    packages: [
      { id: 'p2-single', type: 'Single', price: 1100 },
      { id: 'p2-couple', type: 'Couple', price: 1800 },
      { id: 'p2-family', type: 'Family', price: 2700 }
    ]
  },
  {
    id: 'p3',
    title: 'Kanakadhara Stotram & Lakshmi Havan',
    category: 'Lakshmi',
    description: 'Wealth enhancement ritual to invoke Goddess Lakshmi and attract financial growth and stable fortune.',
    image: '/images/devotional/kashi.jpg',
    packages: [
      { id: 'p3-single', type: 'Single', price: 1500 },
      { id: 'p3-couple', type: 'Couple', price: 2500 },
      { id: 'p3-family', type: 'Family', price: 3600 }
    ]
  },
  {
    id: 'p4',
    title: 'Navgrah Shanti Homa',
    category: 'Durga',
    description: 'Pacify negative astrological impacts of all 9 planetary deities and align health and peace charts.',
    image: '/images/devotional/rammandir.jpg',
    packages: [
      { id: 'p4-single', type: 'Single', price: 1800 },
      { id: 'p4-couple', type: 'Couple', price: 3000 },
      { id: 'p4-family', type: 'Family', price: 4500 }
    ]
  }
]

const findPackage = (item: PujaListing | null, type: string) =>
  item?.packages.find(p => p.type.toLowerCase() === type.toLowerCase()) || null

const EpujaPage = () => {
  const { addToCart } = useCart()
  const searchParams = useSearchParams()
  const bookId = searchParams.get('book')

  // States
  const [activeTab, setActiveTab] = useState('All')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPuja, setSelectedPuja] = useState<PujaListing | null>(null)
  const [packageType, setPackageType] = useState<'Single' | 'Couple' | 'Family'>('Single')
  const [listings, setListings] = useState<PujaListing[]>(FALLBACK_LISTINGS)

  const [formData, setFormData] = useState({
    name: '',
    gotra: '',
    gender: 'Male',
    dob: '',
    birthPlace: '',
    comment: ''
  })

  const [success, setSuccess] = useState(false)

  // Additional family members included alongside the primary devotee — how many rows are
  // shown/required is driven entirely by the selected package: Single = none, Couple = exactly
  // 1 (fixed), Family = 2+ (expandable). Mirrors the Chadhava "persons" pattern.
  const MAX_FAMILY_MEMBERS = 19
  const [familyMembers, setFamilyMembers] = useState<{ name: string; gotra: string }[]>([])

  const handlePackageTypeChange = (value: 'Single' | 'Couple' | 'Family') => {
    setPackageType(value)

    if (value === 'Single') {
      setFamilyMembers([])
    } else if (value === 'Couple') {
      setFamilyMembers([{ name: '', gotra: '' }])
    } else {
      setFamilyMembers(prev => (prev.length >= 2 ? prev : [{ name: '', gotra: '' }, { name: '', gotra: '' }]))
    }
  }

  const addFamilyMemberRow = () =>
    setFamilyMembers(prev => (prev.length >= MAX_FAMILY_MEMBERS ? prev : [...prev, { name: '', gotra: '' }]))

  const removeFamilyMemberRow = (idx: number) =>
    setFamilyMembers(prev => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev))

  const updateFamilyMemberRow = (idx: number, field: 'name' | 'gotra', value: string) =>
    setFamilyMembers(prev => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))

  useEffect(() => {
    fetch('/api/epuja/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setListings(
            data.map((l: any) => ({
              id: l.id,
              title: l.title,
              description: l.description,
              image: l.image,
              category: l.category,
              packages: (l.packages || []).map((p: any) => ({
                id: p.id,
                type: p.type,
                price: p.price,
                offerPrice: p.offerPrice,
                gstPercentage: p.gstPercentage,
                gstInclusive: p.gstInclusive
              }))
            }))
          )
        }
      })
      .catch(() => {
        // Keep the fallback listings on error
      })
  }, [])

  const categories = ['All', ...Array.from(new Set(listings.map(l => l.category))).sort()]

  const filteredPujas = activeTab === 'All' ? listings : listings.filter(p => p.category === activeTab)

  const handleOpenBooking = (item: PujaListing) => {
    setSelectedPuja(item)
    setPackageType('Single')
    setFamilyMembers([])
    setBookingOpen(true)
  }

  const handleClose = () => {
    setBookingOpen(false)
    setSuccess(false)
  }

  // "Book Now" on the detail page (/front-pages/epuja/[id]) links back here with
  // ?book=<listingId> so the same booking dialog/flow opens automatically.
  useEffect(() => {
    if (!bookId) return
    const match = listings.find(l => l.id === bookId)

    if (match) handleOpenBooking(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, listings])

  const getSelectedPackagePrice = () => {
    const pkg = findPackage(selectedPuja, packageType)

    return pkg ? effectivePrice(pkg) : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPuja) return

    const pkg = findPackage(selectedPuja, packageType)

    if (!pkg) return

    const validFamilyMembers = familyMembers.filter(m => m.name.trim() && m.gotra.trim())
    const devotees = [{ name: formData.name, gotra: formData.gotra }, ...validFamilyMembers]

    addToCart({
      id: `${selectedPuja.id}-${packageType}`,
      name: `${selectedPuja.title} (${packageType} Package)`,
      price: effectivePrice(pkg),
      image: selectedPuja.image,
      type: 'puja',
      orderPayload: { pujaListingId: selectedPuja.id, pujaPackageId: pkg.id },
      details: {
        packageType,
        ...formData,
        devotees
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
          page='epuja'
          defaultTitle='Interactive E-Puja Portals'
          defaultSubtitle='Book authentic Vedic Pujas performed by certified pandits at holy pilgrimage sites on your behalf.'
        />

        {/* Categories Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(16,185,129,0.2)', mb: 8, display: 'flex', justifyContent: 'center' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': { color: '#4b5563', fontWeight: 'medium' },
              '& .Mui-selected': { color: '#006241 !important', fontWeight: 'bold' },
              '& .MuiTabs-indicator': { backgroundColor: '#006241' }
            }}
          >
            {categories.map((cat) => (
              <Tab key={cat} label={cat} value={cat} className='text-md px-6' />
            ))}
          </Tabs>
        </Box>

        {/* Listings Grid - small cards, 3 per row */}
        <Grid container spacing={6}>
          {filteredPujas.map((item) => {
            const singlePkg = findPackage(item, 'Single') || item.packages[0]

            return (
              <Grid size={{ xs: 12, sm: 4, md: 4 }} key={item.id}>
                <Card className='galaxy-card flex flex-col justify-between overflow-hidden h-full relative'>
                  <div className='relative h-48 w-full overflow-hidden'>
                    <img src={item.image} alt={item.title} className='w-full h-full object-cover' />
                    <div className='absolute top-4 left-4 bg-emerald-50/90 backdrop-blur-sm text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-200 font-semibold'>
                      {item.category}
                    </div>
                  </div>
                  <CardContent className='p-5 flex flex-col flex-1'>
                    <Typography variant='h6' className='font-bold mb-2 truncate' style={{ color: '#047857' }}>
                      {item.title}
                    </Typography>
                    <Typography variant='body2' className='mb-4 line-clamp-2' style={{ color: '#4b5563' }}>
                      {item.description}
                    </Typography>
                    {singlePkg && (
                      <Typography variant='subtitle2' className='font-semibold mb-4' style={{ color: '#10b981' }}>
                        Starting from:{' '}
                        {hasOfferDiscount(singlePkg) && (
                          <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 4 }}>
                            ₹{singlePkg.price}
                          </span>
                        )}
                        ₹{effectivePrice(singlePkg)}
                      </Typography>
                    )}

                    <div className='flex flex-col gap-2 mt-auto'>
                      <Button
                        component={Link}
                        href={`/front-pages/epuja/${item.id}`}
                        variant='outlined'
                        fullWidth
                        className='font-semibold'
                        style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#006241' }}
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
            )
          })}
        </Grid>

        {/* Booking Dialog */}
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
            <span>Book {selectedPuja?.title} - Devotee Info</span>
            <IconButton onClick={handleClose} size='small' style={{ color: '#006241' }}>
              <i className='tabler-x text-xl' />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent className='py-6 flex flex-col gap-5'>
              {success ? (
                <Alert severity='success'>
                  E-Puja configured successfully! Item added to your cart for checkout.
                </Alert>
              ) : (
                <>
                  <TextField
                    select
                    label='Select Package Type'
                    fullWidth
                    value={packageType}
                    onChange={(e) => handlePackageTypeChange(e.target.value as any)}
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
                    {selectedPuja?.packages.map(pkg => (
                      <MenuItem key={pkg.id} value={pkg.type}>
                        {pkg.type} Puja (₹{effectivePrice(pkg)})
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    required
                    label='Primary Devotee Name'
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
                    required
                    label='Primary Devotee Gotra'
                    fullWidth
                    value={formData.gotra}
                    onChange={(e) => setFormData({ ...formData, gotra: e.target.value })}
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
                    label='Special Instructions (optional)'
                    placeholder='Any special requests for the pandit'
                    multiline
                    rows={2}
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

                  {packageType !== 'Single' && (
                    <Box>
                      <Typography variant='subtitle2' className='font-semibold mb-2' style={{ color: '#374151' }}>
                        {packageType === 'Couple' ? 'Your Partner’s Details' : 'Family Members to Include'}
                      </Typography>
                      <div className='flex flex-col gap-3'>
                        {familyMembers.map((m, idx) => (
                          <div key={idx} className='flex gap-2 items-start'>
                            <TextField
                              required
                              size='small'
                              label={packageType === 'Couple' ? 'Partner Name' : `Family Member ${idx + 1} Name`}
                              fullWidth
                              value={m.name}
                              onChange={(e) => updateFamilyMemberRow(idx, 'name', e.target.value)}
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
                              value={m.gotra}
                              onChange={(e) => updateFamilyMemberRow(idx, 'gotra', e.target.value)}
                              sx={{
                                '& .MuiInputLabel-root': { color: '#6b7280' },
                                '& .MuiOutlinedInput-root': {
                                  color: '#0f172a',
                                  '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                                  '&:hover fieldset': { borderColor: '#10b981' }
                                }
                              }}
                            />
                            {packageType === 'Family' && familyMembers.length > 2 && (
                              <IconButton size='small' onClick={() => removeFamilyMemberRow(idx)} aria-label='Remove family member' sx={{ mt: 0.5 }}>
                                <i className='tabler-x' style={{ fontSize: '16px', color: '#ef4444' }} />
                              </IconButton>
                            )}
                          </div>
                        ))}
                      </div>
                      {packageType === 'Family' && (
                        <Button size='small' onClick={addFamilyMemberRow} startIcon={<i className='tabler-plus' />} className='mt-2 font-semibold' style={{ color: '#006241' }}>
                          Add Another Family Member
                        </Button>
                      )}
                    </Box>
                  )}

                  <Box className='flex justify-between items-center p-4 rounded-lg mt-2' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Typography className='font-semibold' style={{ color: '#374151' }}>Total Price:</Typography>
                    <Typography className='text-2xl font-bold' style={{ color: '#006241' }}>₹{getSelectedPackagePrice()}</Typography>
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
                  Configure & Add to Cart
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>

        <HowItWorksSection page='epuja' items={DEFAULT_HOW_IT_WORKS_STEPS} />

        {/* FAQ Section */}
        <ServiceFaq
          page="epuja"
          title="Interactive E-Puja FAQ"
          subtitle="Frequently asked questions about booking and participating in online Vedic rituals."
          items={[
            {
              question: "Do I need to be online during the Puja?",
              answer: "No, you do not need to be online. The pandits perform the Puja on your behalf chanting your name and gotra. However, you can join the live streaming or watch the recorded session later via your dashboard."
            },
            {
              question: "What details are required to book an E-Puja?",
              answer: "To book a Puja, we require the primary devotee's Name, Gender, Date of Birth, Birth Place (for horoscope mapping), and Gotra or family members' names (for sankalp/resolution chanting)."
            },
            {
              question: "Is Prasad sent after the E-Puja is completed?",
              answer: "Yes! A package containing energized dry fruits Prasad, threads, tilak, and local temple blessings is dispatched to your shipping address and reaches you in 3-5 business days."
            },
            {
              question: "Who performs these online Pujas?",
              answer: "All Pujas are conducted by qualified, certified Vedic pandits and shastris at prominent historical temple complexes in major spiritual cities like Kashi, Kedarnath, and Ujjain."
            }
          ]}
        />
      </div>
    </div>
  )
}

export default EpujaPage
