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
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'

type Props = {
  mode: 'create' | 'edit'
  slugParam?: string
}

type PackageOption = {
  name: string
  salePrice: string
  offerPrice: string
}

export default function OfferEditorClient({ mode, slugParam }: Props) {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    subtitle: '',
    headerImage: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
    details: '<h2>Special Ritual Package</h2>\n<p>Join us for this special event containing holy offerings.</p>\n<ul>\n  <li>VIP Darshan pass included</li>\n  <li>Holy thread and tilak box</li>\n  <li>Personalized video of offering</li>\n</ul>',
    pricingType: 'FLAT', // FLAT, PER_PERSON, PACKAGE
    salePrice: '',
    offerPrice: '',
    gstPercentage: '18',
    gstInclusive: true,
    active: true,
    broadcast: false
  })

  // Dynamic packages array state
  const [packages, setPackages] = useState<PackageOption[]>([
    { name: 'Single Person', salePrice: '1100', offerPrice: '900' },
    { name: 'Couple Puja', salePrice: '2100', offerPrice: '1700' },
    { name: 'Family Package', salePrice: '3100', offerPrice: '2500' }
  ])

  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Auto-generate slug from title (only in create mode)
  const handleTitleChange = (titleVal: string) => {
    setFormData(prev => {
      const updates: any = { title: titleVal }

      if (mode === 'create') {
        updates.slug = titleVal
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      }

      
return { ...prev, ...updates }
    })
  }

  // Load existing offer details if editing
  useEffect(() => {
    if (mode !== 'edit' || !slugParam) return

    const fetchOffer = async () => {
      try {
        const res = await fetch(`/api/offer/${slugParam}`)

        if (!res.ok) throw new Error('Failed to load offer details.')
        const data = await res.json()

        setFormData({
          slug: data.slug,
          title: data.title,
          subtitle: data.subtitle || '',
          headerImage: data.headerImage,
          details: data.details,
          pricingType: data.pricingType || 'FLAT',
          salePrice: String(data.salePrice),
          offerPrice: String(data.offerPrice),
          gstPercentage: String(data.gstPercentage),
          gstInclusive: data.gstInclusive,
          active: data.active,
          broadcast: false
        })

        if (data.packages && Array.isArray(data.packages)) {
          setPackages(
            data.packages.map((pkg: any) => ({
              name: pkg.name || '',
              salePrice: String(pkg.salePrice || ''),
              offerPrice: String(pkg.offerPrice || '')
            }))
          )
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred loading offer.')
      } finally {
        setLoading(false)
      }
    }

    fetchOffer()
  }, [mode, slugParam])

  // Package builder handlers
  const handleAddPackage = () => {
    setPackages([...packages, { name: '', salePrice: '', offerPrice: '' }])
  }

  const handleRemovePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  const handlePackageFieldChange = (index: number, field: keyof PackageOption, val: string) => {
    const updated = [...packages]

    updated[index][field] = val
    setPackages(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Form validation
    if (formData.pricingType === 'PACKAGE' && packages.length === 0) {
      setErrorMsg('You must define at least one package option.')
      setSubmitting(false)
      
return
    }

    // Determine fallback values for base prices if PACKAGE mode
    let resolvedSalePrice = Number(formData.salePrice || 0)
    let resolvedOfferPrice = Number(formData.offerPrice || 0)

    if (formData.pricingType === 'PACKAGE' && packages.length > 0) {
      resolvedSalePrice = Number(packages[0].salePrice || 0)
      resolvedOfferPrice = Number(packages[0].offerPrice || 0)
    }

    try {
      const url = mode === 'create' ? '/api/offer' : `/api/offer/${slugParam}/edit`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Transform packages for transmission
      const formattedPackages = formData.pricingType === 'PACKAGE'
        ? packages.map(pkg => ({
            name: pkg.name,
            salePrice: Number(pkg.salePrice || 0),
            offerPrice: Number(pkg.offerPrice || 0)
          }))
        : null

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salePrice: resolvedSalePrice,
          offerPrice: resolvedOfferPrice,
          gstPercentage: Number(formData.gstPercentage),
          packages: formattedPackages
        })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save offer.')
      }

      setSuccessMsg(mode === 'create' ? 'Offer created and published successfully!' : 'Offer updated successfully!')
      setTimeout(() => {
        router.push(`/${locale}/apps/mandir-setu/offers`)
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress style={{ color: '#059669' }} />
      </Box>
    )
  }

  return (
    <Card className='p-6'>
      <Typography variant='h4' className='font-bold mb-1' style={{ color: '#047857' }}>
        {mode === 'create' ? '🏷️ Create Special Offer' : '🏷️ Edit Special Offer'}
      </Typography>
      <Typography variant='body2' color='textSecondary' className='mb-6'>
        Fill in promotional fields and details. The page generated is accessible directly via its slug URL.
      </Typography>

      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}
      {successMsg && <Alert severity='success' className='mb-4'>{successMsg}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={6}>
          {/* Form Parameters */}
          <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-5'>
            <TextField
              required
              label='Offer Title'
              fullWidth
              value={formData.title}
              onChange={e => handleTitleChange(e.target.value)}
            />

            <TextField
              label='Subtitle / Catchy Tagline'
              fullWidth
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
            />

            <TextField
              required
              label='URL Slug (unique direct link)'
              fullWidth
              disabled={mode === 'edit'}
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, '') })}
              helperText={mode === 'create' ? 'This defines the link path: /front-pages/offer/[slug]' : ''}
            />

            <TextField
              required
              label='Header Image URL'
              fullWidth
              value={formData.headerImage}
              onChange={e => setFormData({ ...formData, headerImage: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel id='pricing-type-label'>Pricing Model / Structure Type</InputLabel>
              <Select
                labelId='pricing-type-label'
                value={formData.pricingType}
                label='Pricing Model / Structure Type'
                onChange={e => setFormData({ ...formData, pricingType: e.target.value })}
              >
                <MenuItem value='FLAT'>Flat Pricing (Single checkout price)</MenuItem>
                <MenuItem value='PER_PERSON'>Per-Person Pricing (Charge per devotee, like Chadhava)</MenuItem>
                <MenuItem value='PACKAGE'>Package-wise Pricing (Multiple package tiers, like E-Puja)</MenuItem>
              </Select>
            </FormControl>

            {/* Render Base Price Inputs for FLAT or PER_PERSON */}
            {formData.pricingType !== 'PACKAGE' && (
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    type='number'
                    label={formData.pricingType === 'PER_PERSON' ? 'Sale Price per Person (₹)' : 'Original Price (Sale Price ₹)'}
                    fullWidth
                    value={formData.salePrice}
                    onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    type='number'
                    label={formData.pricingType === 'PER_PERSON' ? 'Offer Price per Person (₹)' : 'Discounted Price (Offer Price ₹)'}
                    fullWidth
                    value={formData.offerPrice}
                    onChange={e => setFormData({ ...formData, offerPrice: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}

            {/* Render Dynamic Packages Builder for PACKAGE pricing */}
            {formData.pricingType === 'PACKAGE' && (
              <Box className='border rounded-lg p-4 bg-slate-50'>
                <Box className='flex justify-between items-center mb-3'>
                  <Typography variant='subtitle2' className='font-bold text-slate-700'>
                    🎁 Package Pricing Tiers
                  </Typography>
                  <Button
                    size='small'
                    variant='outlined'
                    style={{ color: '#059669', borderColor: '#059669' }}
                    startIcon={<i className='tabler-plus' />}
                    onClick={handleAddPackage}
                  >
                    Add Package Option
                  </Button>
                </Box>
                {packages.length === 0 ? (
                  <Typography variant='caption' color='textSecondary' className='block text-center py-4'>
                    No package options defined yet. Click "Add Package Option" to create one.
                  </Typography>
                ) : (
                  <Box className='flex flex-col gap-3'>
                    {packages.map((pkg, idx) => (
                      <Grid container spacing={2} key={idx} className='items-center'>
                        <Grid size={{ xs: 5 }}>
                          <TextField
                            size='small'
                            required
                            label='Package Name (e.g. Family)'
                            fullWidth
                            value={pkg.name}
                            onChange={e => handlePackageFieldChange(idx, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <TextField
                            size='small'
                            required
                            type='number'
                            label='Sale (₹)'
                            fullWidth
                            value={pkg.salePrice}
                            onChange={e => handlePackageFieldChange(idx, 'salePrice', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <TextField
                            size='small'
                            required
                            type='number'
                            label='Offer (₹)'
                            fullWidth
                            value={pkg.offerPrice}
                            onChange={e => handlePackageFieldChange(idx, 'offerPrice', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 1 }} className='text-center'>
                          <IconButton
                            size='small'
                            style={{ color: '#ef4444' }}
                            onClick={() => handleRemovePackage(idx)}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            <Grid container spacing={4} className='items-center'>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type='number'
                  label='GST Percentage (%)'
                  fullWidth
                  value={formData.gstPercentage}
                  onChange={e => setFormData({ ...formData, gstPercentage: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.gstInclusive}
                      onChange={e => setFormData({ ...formData, gstInclusive: e.target.checked })}
                    />
                  }
                  label='Pricing includes GST'
                />
              </Grid>
            </Grid>

            <Box className='flex gap-4 mt-2'>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  />
                }
                label='Active (visible via direct link)'
              />
              {mode === 'create' && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.broadcast}
                      onChange={e => setFormData({ ...formData, broadcast: e.target.checked })}
                    />
                  }
                  label='Broadcast (Email/WhatsApp to all users)'
                />
              )}
            </Box>

            <Box className='flex gap-4 mt-4'>
              <Button
                type='submit'
                variant='contained'
                disabled={submitting}
                style={{ backgroundColor: '#059669' }}
                className='font-bold px-6 py-2.5'
              >
                {submitting ? 'Saving Offer...' : mode === 'create' ? 'Publish Promotion' : 'Save Changes'}
              </Button>
              <Button
                variant='outlined'
                style={{ color: '#6b7280', borderColor: '#6b7280' }}
                onClick={() => router.push(`/${locale}/apps/mandir-setu/offers`)}
              >
                Cancel
              </Button>
            </Box>
          </Grid>

          {/* HTML Details Content Editor & Live Preview */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant='subtitle1' className='font-bold mb-2' style={{ color: '#047857' }}>
              Details Content (HTML Layout Editor)
            </Typography>
            <TextField
              required
              multiline
              rows={10}
              fullWidth
              value={formData.details}
              onChange={e => setFormData({ ...formData, details: e.target.value })}
              helperText='Design sections by writing custom HTML tags (e.g. <h2>, <p>, <ul>, <img>)'
              className='mb-4'
            />

            <Divider className='my-4' />

            <Typography variant='subtitle2' className='font-bold text-slate-700 mb-2'>
              Live Details Layout Preview:
            </Typography>
            <Box
              className='p-4 rounded-xl border overflow-y-auto'
              style={{
                height: '220px',
                background: '#fafafa',
                borderColor: '#e2e8f0',
                maxHeight: '220px'
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: formData.details || '<p style="color:#94a3b8">Write details in HTML to preview them...</p>' }}
                style={{ wordBreak: 'break-word' }}
              />
            </Box>
          </Grid>
        </Grid>
      </form>
    </Card>
  )
}
