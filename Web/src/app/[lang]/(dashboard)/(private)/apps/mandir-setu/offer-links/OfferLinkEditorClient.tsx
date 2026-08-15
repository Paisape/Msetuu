'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

type Props = {
  editId?: string
}

export default function OfferLinkEditorClient({ editId }: Props) {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [loading, setLoading] = useState(editId ? true : false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [gstIncluded, setGstIncluded] = useState(false)
  const [gstRate, setGstRate] = useState('18')
  const [htmlContent, setHtmlContent] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Autogenerate slug from title on creation
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!editId) {
      const clean = val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
      setSlug(clean)
    }
  }

  // Load existing data if editing
  useEffect(() => {
    if (!editId) return
    const loadOffer = async () => {
      try {
        const res = await fetch('/api/offers')
        if (!res.ok) throw new Error('Failed to load offer link.')
        const data = await res.json()
        const offer = data.find((o: any) => o.id === editId)
        
        if (!offer) throw new Error('Offer Link not found.')

        setTitle(offer.title)
        setSlug(offer.slug)
        setSalePrice(offer.salePrice.toString())
        setOfferPrice(offer.offerPrice.toString())
        setGstIncluded(offer.gstIncluded)
        setGstRate(offer.gstRate.toString())
        setHtmlContent(offer.htmlContent)
        setIsActive(offer.isActive)
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading offer link.')
      } finally {
        setLoading(false)
      }
    }

    loadOffer()
  }, [editId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        title: title.trim(),
        salePrice: Number(salePrice),
        offerPrice: Number(offerPrice),
        gstIncluded,
        gstRate: Number(gstRate),
        htmlContent,
        isActive
      }

      const url = editId ? `/api/offers/${editId}` : '/api/offers'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save offer link.')
      }

      router.push(`/${locale}/apps/mandir-setu/offer-links`)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress style={{ color: '#FF671F' }} />
      </Box>
    )
  }

  return (
    <Card className='p-6 max-w-4xl mx-auto'>
      <div className='mb-6'>
        <Typography variant='h4' className='font-bold text-slate-800'>
          {editId ? '📝 Edit Offer Link' : '➕ Create Offer Link'}
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          Configure the public URL, pricing dynamics, GST rates, and paste your custom HTML code.
        </Typography>
      </div>

      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          <TextField
            label='Campaign Title *'
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label='URL Slug *'
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
            required
            fullWidth
            helperText={`Public URL will be: ${window.location.origin}/o/${slug || '[slug]'}`}
          />

          <TextField
            label='Offer Price (₹) *'
            type='number'
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            required
            fullWidth
            helperText='Vedic booking price charged to devotee'
          />

          <TextField
            label='Sale Price (₹) *'
            type='number'
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            required
            fullWidth
            helperText='Original struck-through reference price'
          />

          <TextField
            label='GST Rate (%) *'
            type='number'
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            required
            fullWidth
          />

          <div className='flex items-center gap-4'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={gstIncluded}
                  onChange={(e) => setGstIncluded(e.target.checked)}
                />
              }
              label='GST is included in Offer Price'
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              }
              label='Active and visible'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Typography variant='subtitle1' className='font-bold text-slate-700'>
            HTML Layout Code *
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Paste the raw HTML of your landing page design. Any button or link with `class="book-now-trigger"` or `href="#book"` will trigger the checkout booking form dynamically.
          </Typography>
          <textarea
            required
            rows={15}
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder='<!-- Paste full HTML structure here -->'
            className='w-full p-4 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#FF671F] bg-white text-slate-800'
          />
        </div>

        <div className='flex gap-4 justify-end'>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links`)}
            className='border-slate-300 text-slate-700 font-bold'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={submitting}
            style={{ backgroundColor: '#FF671F' }}
            className='font-bold text-white'
          >
            {submitting ? 'Saving...' : 'Save Offer Link'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
