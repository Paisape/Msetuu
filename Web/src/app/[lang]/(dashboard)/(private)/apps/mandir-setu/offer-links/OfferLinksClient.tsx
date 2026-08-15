'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
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

type OfferLink = {
  id: string
  slug: string
  title: string
  salePrice: string
  offerPrice: string
  gstIncluded: boolean
  gstRate: string
  isActive: boolean
  createdAt: string
  _count: {
    orders: number
    analytics: number
  }
}

export default function OfferLinksClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [links, setLinks] = useState<OfferLink[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/offers')
      if (!res.ok) throw new Error('Failed to load offer links.')
      const data = await res.json()
      setLinks(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer link? This will also remove associated analytics.')) return

    try {
      const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete offer link.')
      }

      setSuccessMsg('Offer Link deleted successfully!')
      setLinks(links.filter(l => l.id !== id))
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete offer link.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  const handleCopyLink = (slug: string) => {
    const origin = window.location.origin
    const url = `${origin}/o/${slug}`
    navigator.clipboard.writeText(url)
    setSuccessMsg(`Copied link: ${url}`)
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
    <Card className='p-6'>
      <Box className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <div>
          <Typography variant='h4' className='font-bold text-slate-800 flex items-center gap-2'>
            🔗 Offer Links Generator
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Generate dynamic, chrome-free landing pages with direct guest payments and referral tracking.
          </Typography>
        </div>
        <div className='flex gap-3 flex-wrap'>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links/referrals`)}
            startIcon={<i className='tabler-users' />}
            className="border-slate-300 text-slate-700"
          >
            Referrals
          </Button>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links/reconcile`)}
            startIcon={<i className='tabler-file-analytics' />}
            className="border-slate-300 text-slate-700"
          >
            Reconcile
          </Button>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links/reports`)}
            startIcon={<i className='tabler-chart-bar' />}
            className="border-slate-300 text-slate-700"
          >
            Reports
          </Button>
          <Button
            variant='contained'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links/create`)}
            startIcon={<i className='tabler-plus' />}
            style={{ backgroundColor: '#FF671F' }}
            className="font-bold text-white"
          >
            Create Link
          </Button>
        </div>
      </Box>

      {successMsg && <Alert severity='success' className='mb-4'>{successMsg}</Alert>}
      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

      <TableContainer className='border rounded-lg overflow-hidden'>
        <Table>
          <TableHead className='bg-slate-50'>
            <TableRow>
              <TableCell className='font-bold'>Title</TableCell>
              <TableCell className='font-bold'>URL Slug</TableCell>
              <TableCell className='font-bold'>Offer Price (₹)</TableCell>
              <TableCell className='font-bold'>Sale Price (₹)</TableCell>
              <TableCell className='font-bold text-center'>GST</TableCell>
              <TableCell className='font-bold text-center'>Views</TableCell>
              <TableCell className='font-bold text-center'>Bookings</TableCell>
              <TableCell className='font-bold'>Status</TableCell>
              <TableCell className='font-bold text-right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-center py-8 text-slate-400'>
                  No offer links created yet. Click "Create Link" to build one!
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id} className='hover:bg-slate-50/50'>
                  <TableCell className='font-semibold text-slate-700'>{link.title}</TableCell>
                  <TableCell>
                    <span 
                      onClick={() => handleCopyLink(link.slug)}
                      className='cursor-pointer text-[#FF671F] font-medium hover:underline flex items-center gap-1'
                    >
                      /o/{link.slug} <i className='tabler-copy text-xs' />
                    </span>
                  </TableCell>
                  <TableCell className='font-bold text-slate-800'>₹{Number(link.offerPrice).toFixed(2)}</TableCell>
                  <TableCell className='text-slate-400 line-through'>₹{Number(link.salePrice).toFixed(2)}</TableCell>
                  <TableCell className='text-center'>
                    <Chip 
                      label={link.gstIncluded ? `Included (${Number(link.gstRate)}%)` : `Excluded (${Number(link.gstRate)}%)`} 
                      size='small'
                      variant='outlined'
                      className={link.gstIncluded ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}
                    />
                  </TableCell>
                  <TableCell className='text-center font-semibold text-slate-600'>{link._count.analytics}</TableCell>
                  <TableCell className='text-center font-bold text-slate-800'>{link._count.orders}</TableCell>
                  <TableCell>
                    <Chip 
                      label={link.isActive ? 'Active' : 'Disabled'} 
                      size='small'
                      color={link.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell className='text-right space-x-1'>
                    <IconButton 
                      onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links/edit/${link.id}`)}
                      size='small'
                      className='text-slate-500 hover:text-amber-600'
                    >
                      <i className='tabler-edit text-lg' />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(link.id)}
                      size='small'
                      className='text-slate-500 hover:text-red-600'
                    >
                      <i className='tabler-trash text-lg' />
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
