'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { ORDER_MODULES, ORDER_TYPE_MAP } from '../orderModules'

const SKIP_KEYS = new Set(['id', 'userId', 'chadhavaListingId', 'pujaListingId', 'pujaPackageId', 'kundliListingId', 'productId', 'astrologerId', 'videoUrl', 'videoUploadedAt', 'videoExpired'])
const NESTED_KEYS = new Set(['chadhavaListing', 'pujaListing', 'pujaPackage', 'kundliListing', 'product', 'astrologer', 'user'])

const humanize = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase())

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—'

  if (key.toLowerCase().includes('date') || key === 'dob' || key === 'createdAt' || key === 'slotTime' || key === 'travelDate') {
    const d = new Date(value as string)

    if (!Number.isNaN(d.getTime())) return d.toLocaleString('en-IN')
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  return String(value)
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  CONFIRMED: 'info',
  SHARED_WITH_PANDIT: 'info',
  DISPATCHED: 'info',
  SHIPPED: 'info',
  COMPLETED: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error',
  FAILED: 'error',
  PAID: 'success'
}

type TrailEntry = {
  id: string
  status: string
  note?: string | null
  createdAt: string
  actorName: string
  actorRole?: string
  ip?: string | null
  userAgent?: string | null
}

const OrderDetailClient = ({ module, id }: { module: string; id: string }) => {
  const config = ORDER_MODULES[module]
  const orderType = ORDER_TYPE_MAP[module]

  const [order, setOrder] = useState<Record<string, any> | null>(null)
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const [orderRes, trailRes, invoiceRes] = await Promise.all([
        fetch(`/api/${module}/${id}`),
        fetch(`/api/orders/trail?type=${orderType}&id=${id}`),
        fetch(`/api/invoices?orderType=${orderType}&orderId=${id}`)
      ])

      const orderData = await orderRes.json().catch(() => null)

      if (!orderRes.ok) throw new Error(orderData?.error || 'Failed to load order.')
      setOrder(orderData)

      const trailData = await trailRes.json().catch(() => [])

      setTrail(Array.isArray(trailData) ? trailData : [])

      const invoiceData = await invoiceRes.json().catch(() => [])

      if (Array.isArray(invoiceData) && invoiceData.length > 0) setInvoiceId(invoiceData[0].id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load order.')
    } finally {
      setLoading(false)
    }
  }, [module, id, orderType])

  useEffect(() => {
    load()
  }, [load])

  if (!config) return <Typography className='p-6'>Unknown order module.</Typography>

  if (loading) {
    return (
      <div className='p-12 text-center'>
        <CircularProgress size={24} />
      </div>
    )
  }

  if (errorMsg || !order) {
    return (
      <div className='p-6'>
        <Alert severity='error'>{errorMsg || 'Order not found.'}</Alert>
      </div>
    )
  }

  const scalarEntries = Object.entries(order).filter(
    ([key, value]) => !SKIP_KEYS.has(key) && !NESTED_KEYS.has(key) && typeof value !== 'object'
  )

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div>
          <Button component={Link} href={`/apps/mandir-setu/orders/${module}`} startIcon={<i className='tabler-arrow-left' />} className='mb-2'>
            Back to {config.title}
          </Button>
          <Typography variant='h4' className='font-bold'>
            Order {order.id}
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Chip label={order.status} color={STATUS_COLORS[order.status] || 'default'} />
          {order.paymentStatus && <Chip label={`Payment: ${order.paymentStatus}`} color={STATUS_COLORS[order.paymentStatus] || 'default'} variant='outlined' />}
          {invoiceId && (
            <Button component={Link} href={`/apps/mandir-setu/accounts/invoices/${invoiceId}`} variant='outlined' size='small' startIcon={<i className='tabler-receipt' />}>
              View Invoice
            </Button>
          )}
        </div>
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card className='mb-6'>
            <CardHeader title='Order Details' />
            <CardContent>
              <Grid container spacing={4}>
                {scalarEntries.map(([key, value]) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={key}>
                    <Typography variant='caption' className='text-textSecondary block'>
                      {humanize(key)}
                    </Typography>
                    <Typography className='font-medium'>{formatValue(key, value)}</Typography>
                  </Grid>
                ))}
              </Grid>

              {Array.isArray(order.persons) && order.persons.length > 0 && (
                <div className='mt-6'>
                  <Divider className='mb-4' />
                  <Typography variant='subtitle1' className='font-bold mb-2'>
                    Persons ({order.persons.length})
                  </Typography>
                  <div className='flex flex-col gap-2'>
                    {(order.persons as { name: string; gotra: string }[]).map((p, i) => (
                      <Typography key={i} variant='body2'>
                        {i + 1}. {p.name} — Gotra: {p.gotra}
                      </Typography>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(order.devotees) && order.devotees.length > 0 && (
                <div className='mt-6'>
                  <Divider className='mb-4' />
                  <Typography variant='subtitle1' className='font-bold mb-2'>
                    Devotees ({order.devotees.length})
                  </Typography>
                  <div className='flex flex-col gap-2'>
                    {(order.devotees as { name: string; gotra: string }[]).map((p, i) => (
                      <Typography key={i} variant='body2'>
                        {i + 1}. {p.name} — Gotra: {p.gotra}
                      </Typography>
                    ))}
                  </div>
                </div>
              )}

              {order.videoUrl && !order.videoExpired && (
                <Alert severity='success' className='mt-6'>
                  Video uploaded —{' '}
                  <a href={order.videoUrl} target='_blank' rel='noreferrer' className='font-semibold'>
                    view on Google Drive
                  </a>
                  {order.videoUploadedAt && ` (uploaded ${new Date(order.videoUploadedAt).toLocaleString('en-IN')}, removed after 48 hours)`}
                </Alert>
              )}
              {order.videoExpired && (
                <Alert severity='info' className='mt-6'>
                  Video was available for 48 hours after upload and has since been removed from the server. It was emailed to the customer at upload time.
                </Alert>
              )}

              {NESTED_KEYS.size > 0 &&
                Object.entries(order)
                  .filter(([key, value]) => NESTED_KEYS.has(key) && value && typeof value === 'object')
                  .map(([key, value]) => (
                    <div key={key} className='mt-6'>
                      <Divider className='mb-4' />
                      <Typography variant='subtitle1' className='font-bold mb-2'>
                        {humanize(key)}
                      </Typography>
                      <Grid container spacing={4}>
                        {Object.entries(value as Record<string, unknown>)
                          .filter(([k, v]) => !['id', 'createdAt'].includes(k) && typeof v !== 'object')
                          .map(([k, v]) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={k}>
                              <Typography variant='caption' className='text-textSecondary block'>
                                {humanize(k)}
                              </Typography>
                              <Typography className='font-medium'>{formatValue(k, v)}</Typography>
                            </Grid>
                          ))}
                      </Grid>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardHeader title='Order Trail' subheader='Status history, timestamps, and who made each change' />
            <CardContent>
              {trail.length === 0 ? (
                <Typography className='text-textSecondary'>No trail entries yet.</Typography>
              ) : (
                <div className='flex flex-col gap-4'>
                  {trail.map(entry => (
                    <div key={entry.id} className='flex gap-3'>
                      <Chip size='small' label={entry.status.replace(/_/g, ' ')} color={STATUS_COLORS[entry.status] || 'default'} />
                      <div className='flex-1'>
                        <Typography variant='body2' className='font-medium'>
                          {entry.note || entry.status.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant='caption' className='text-textSecondary block'>
                          {new Date(entry.createdAt).toLocaleString('en-IN')} · {entry.actorName}
                          {entry.actorRole ? ` (${entry.actorRole})` : ''}
                        </Typography>
                        {(entry.ip || entry.userAgent) && (
                          <Typography variant='caption' className='text-textSecondary block mt-1' style={{ opacity: 0.7 }}>
                            {entry.ip ? `IP: ${entry.ip}` : ''}
                            {entry.ip && entry.userAgent ? ' · ' : ''}
                            {entry.userAgent ? `Device: ${entry.userAgent}` : ''}
                          </Typography>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default OrderDetailClient
