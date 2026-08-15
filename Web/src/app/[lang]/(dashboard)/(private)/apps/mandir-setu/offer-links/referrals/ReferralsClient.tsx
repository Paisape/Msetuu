'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

type Referral = {
  id: string
  code: string
  partnerName: string
  commissionRate: string
  isActive: boolean
  createdAt: string
}

type OfferLink = {
  id: string
  slug: string
  title: string
}

export default function ReferralsClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [referrals, setReferrals] = useState<Referral[]>([])
  const [offers, setOffers] = useState<OfferLink[]>([])
  const [selectedOfferSlug, setSelectedOfferSlug] = useState<string>('')

  // New Code Form
  const [code, setCode] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [commissionRate, setCommissionRate] = useState('10')

  const loadData = async () => {
    try {
      const [refRes, offerRes] = await Promise.all([
        fetch('/api/offers/referrals'),
        fetch('/api/offers')
      ])

      if (!refRes.ok || !offerRes.ok) throw new Error('Failed to load referrals data.')

      const refData = await refRes.json()
      const offerData = await offerRes.json()

      setReferrals(refData)
      setOffers(offerData)
      if (offerData.length > 0) {
        setSelectedOfferSlug(offerData[0].slug)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred loading referrals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/offers/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          partnerName: partnerName.trim(),
          commissionRate: Number(commissionRate)
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save referral code.')

      setSuccessMsg('Referral code created successfully!')
      setReferrals([data.referral, ...referrals])
      setCode('')
      setPartnerName('')
      setCommissionRate('10')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCodeLink = (partnerCode: string) => {
    if (!selectedOfferSlug) {
      alert('Please create an active Offer Link campaign first to copy a referral URL.')
      return
    }

    const origin = window.location.origin
    const url = `${origin}/o/${selectedOfferSlug}?ref=${partnerCode}`
    navigator.clipboard.writeText(url)
    setSuccessMsg(`Copied link for ${partnerCode}: ${url}`)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress style={{ color: '#FF671F' }} />
      </Box>
    )
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8'>
      {/* Create Referral Code */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Typography variant='h4' className='font-bold text-slate-800 mb-2'>
          👥 Create Partner Referral Code
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          Generate manual tracking referral codes for Pandits and promotion partners.
        </Typography>

        {successMsg && <Alert severity='success' className='mb-4'>{successMsg}</Alert>}
        {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

        <form onSubmit={handleSubmit} className='grid grid-cols-1 sm:grid-cols-4 gap-6 items-end'>
          <TextField
            label='Referral Code *'
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder='e.g. SHASTRI10'
            required
            fullWidth
          />
          <TextField
            label='Partner Name *'
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder='e.g. Pandit Rakesh Shastri'
            required
            fullWidth
          />
          <TextField
            label='Commission Rate (%)'
            type='number'
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            required
            fullWidth
          />
          <Button
            type='submit'
            variant='contained'
            disabled={submitting}
            style={{ backgroundColor: '#FF671F', height: '56px' }}
            className='font-bold text-white w-full'
          >
            {submitting ? 'Creating...' : 'Create Code'}
          </Button>
        </form>
      </Card>

      {/* Referral Code Directory */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Box className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
          <div>
            <Typography variant='h5' className='font-bold text-slate-800'>
              📋 Partner Code Directory
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              List and manage active codes, and select campaigns to generate dynamic landing page URLs.
            </Typography>
          </div>

          {offers.length > 0 && (
            <div className='flex items-center gap-2'>
              <span className='text-xs font-bold text-slate-500'>Select Campaign:</span>
              <Select
                value={selectedOfferSlug}
                onChange={(e) => setSelectedOfferSlug(e.target.value)}
                size='small'
                className='bg-white text-sm min-w-[200px]'
              >
                {offers.map(o => (
                  <MenuItem key={o.id} value={o.slug}>{o.title}</MenuItem>
                ))}
              </Select>
            </div>
          )}
        </Box>

        <TableContainer className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold'>Partner Code</TableCell>
                <TableCell className='font-bold'>Partner Name</TableCell>
                <TableCell className='font-bold text-center'>Commission</TableCell>
                <TableCell className='font-bold'>Date Created</TableCell>
                <TableCell className='font-bold text-right'>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8 text-slate-400'>
                    No referral codes generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((ref) => (
                  <TableRow key={ref.id} className='hover:bg-slate-50/50'>
                    <TableCell className='font-bold text-[#000080]'>{ref.code}</TableCell>
                    <TableCell className='font-semibold text-slate-700'>{ref.partnerName}</TableCell>
                    <TableCell className='text-center font-bold text-slate-600'>{Number(ref.commissionRate)}%</TableCell>
                    <TableCell className='text-slate-500'>
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => handleCopyCodeLink(ref.code)}
                        startIcon={<i className='tabler-copy text-xs' />}
                        style={{ borderColor: '#FF671F', color: '#FF671F' }}
                        className='font-bold'
                      >
                        Copy URL
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div className='flex justify-start mt-6'>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links`)}
            className='border-slate-300 text-slate-700 font-bold'
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}
