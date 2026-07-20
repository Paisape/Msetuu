'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

type Offer = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  headerImage: string
  salePrice: number
  offerPrice: number
  active: boolean
  visitsCount: number
  createdAt: string
  _count: {
    orders: number
    visits: number
  }
}

export default function OffersClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadOffers = async () => {
    try {
      const res = await fetch('/api/offer')

      if (!res.ok) throw new Error('Failed to load offers.')
      const data = await res.json()

      setOffers(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffers()
  }, [])

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this offer and all its tracking data?')) return

    try {
      const res = await fetch(`/api/offer/${slug}/edit`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => null)

        throw new Error(data?.error || 'Failed to delete offer.')
      }

      setSuccessMsg('Offer deleted successfully!')
      setOffers(offers.filter(o => o.slug !== slug))
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete offer.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  const handleCopyLink = (slug: string) => {
    const origin = window.location.origin
    const url = `${origin}/front-pages/offer/${slug}`

    navigator.clipboard.writeText(url)
    setSuccessMsg(`Copied offer link: ${url}`)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress style={{ color: '#006241' }} />
      </Box>
    )
  }

  return (
    <Card className='p-6'>
      <Box className='flex justify-between items-center mb-6'>
        <div>
          <Typography variant='h4' className='font-bold' style={{ color: '#047857' }}>
            🏷️ Special Offers Engine
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Create promotional landing pages, copy direct links, and track customer visits/orders.
          </Typography>
        </div>
        <Button
          variant='contained'
          color='primary'
          className='font-bold'
          style={{ backgroundColor: '#006241' }}
          onClick={() => router.push(`/${locale}/apps/mandir-setu/offers/create`)}
          startIcon={<i className='tabler-plus' />}
        >
          Create Offer
        </Button>
      </Box>

      {successMsg && <Alert severity='success' className='mb-4'>{successMsg}</Alert>}
      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

      <TableContainer className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHead style={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell style={{ width: '80px' }}></TableCell>
              <TableCell className='font-bold'>Title & Subtitle</TableCell>
              <TableCell className='font-bold'>URL Slug</TableCell>
              <TableCell className='font-bold'>Prices (₹)</TableCell>
              <TableCell className='font-bold text-center'>Visits</TableCell>
              <TableCell className='font-bold text-center'>Orders</TableCell>
              <TableCell className='font-bold'>Active</TableCell>
              <TableCell className='font-bold text-right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-slate-500'>
                  No special offers found. Click "Create Offer" to publish your first promotion.
                </TableCell>
              </TableRow>
            ) : (
              offers.map(offer => (
                <TableRow key={offer.id} hover>
                  <TableCell>
                    <img
                      src={offer.headerImage}
                      alt=''
                      className='w-12 h-12 object-cover rounded border'
                      onError={e => {
                        ;(e.target as any).src = 'https://images.unsplash.com/photo-1605649487212-47bdab064df7'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography className='font-bold' style={{ color: '#0f172a' }}>
                      {offer.title}
                    </Typography>
                    {offer.subtitle && (
                      <Typography variant='caption' color='textSecondary' className='block'>
                        {offer.subtitle}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/front-pages/offer/${offer.slug}`}
                      target='_blank'
                      className='text-emerald-600 font-semibold hover:underline'
                    >
                      /{offer.slug}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className='line-through text-slate-400 mr-2'>₹{offer.salePrice}</span>
                    <strong style={{ color: '#006241' }}>₹{offer.offerPrice}</strong>
                  </TableCell>
                  <TableCell className='text-center font-bold text-slate-700'>
                    {offer.visitsCount}
                  </TableCell>
                  <TableCell className='text-center font-bold text-slate-700'>
                    {offer._count.orders}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={offer.active ? 'Active' : 'Draft'}
                      color={offer.active ? 'success' : 'default'}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell className='text-right'>
                    <IconButton
                      title='Copy Page URL'
                      size='small'
                      onClick={() => handleCopyLink(offer.slug)}
                      style={{ color: '#006241', marginRight: 4 }}
                    >
                      <i className='tabler-copy' />
                    </IconButton>
                    <IconButton
                      title='Edit Details'
                      size='small'
                      onClick={() => router.push(`/${locale}/apps/mandir-setu/offers/edit/${offer.slug}`)}
                      style={{ color: '#3b82f6', marginRight: 4 }}
                    >
                      <i className='tabler-edit' />
                    </IconButton>
                    <IconButton
                      title='Delete Offer'
                      size='small'
                      onClick={() => handleDelete(offer.slug)}
                      style={{ color: '#ef4444' }}
                    >
                      <i className='tabler-trash' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
