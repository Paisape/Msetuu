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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

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
  if (typeof value === 'number') return value.toLocaleString('en-IN')

  return String(value)
}

const parseUserAgent = (ua?: string) => {
  if (!ua) return 'Desktop / Browser'
  let os = 'Desktop'
  let browser = 'Browser'

  if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'

  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'

  return `${os} (${browser})`
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
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sendingSms, setSendingSms] = useState(false)
  const [smsResult, setSmsResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const handleResendSms = async () => {
    if (!order) return
    setSendingSms(true)
    setSmsResult(null)

    const primaryPhone = order.devotees?.[0]?.phone || order.devoteePhone || order.customerPhone || order.user?.phone || ''

    try {
      const res = await fetch('/api/admin/orders/resend-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          orderType: module === 'offer' ? 'OFFER_LINK' : orderType,
          mobileOverride: primaryPhone
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch confirmation SMS.')

      setSmsResult({ type: 'success', msg: data.message || `Confirmation SMS successfully sent to ${primaryPhone}!` })
    } catch (err: any) {
      setSmsResult({ type: 'error', msg: err.message || 'SMS dispatch failed. Check SMS settings and credentials.' })
    } finally {
      setSendingSms(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const fetchUrl = module === 'offer' ? `/api/offer/orders/${id}` : `/api/${module}/${id}`
      const [orderRes, trailRes, invoiceRes] = await Promise.all([
        fetch(fetchUrl),
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

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const patchUrl = module === 'offer' ? `/api/offer/orders/${id}` : `/api/${module}/${id}`
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update order status.')
      await load()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

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
        <div className='flex items-center gap-3 flex-wrap'>
          <Chip label={order.status} color={STATUS_COLORS[order.status] || 'default'} />
          {order.paymentStatus && <Chip label={`Payment: ${order.paymentStatus}`} color={STATUS_COLORS[order.paymentStatus] || 'default'} variant='outlined' />}
          
          <FormControl size='small' className='min-w-[170px] bg-white'>
            <InputLabel id='status-change-label'>Change Status</InputLabel>
            <Select
              labelId='status-change-label'
              label='Change Status'
              value={order.status || ''}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
            >
              <MenuItem value='PENDING'>PENDING</MenuItem>
              <MenuItem value='PROCESSING'>PROCESSING</MenuItem>
              <MenuItem value='CONFIRMED'>CONFIRMED</MenuItem>
              <MenuItem value='RECONCILED_AUTO'>RECONCILED AUTO</MenuItem>
              <MenuItem value='RECONCILED_MANUAL'>RECONCILED MANUAL</MenuItem>
              <MenuItem value='COMPLETED'>COMPLETED</MenuItem>
              <MenuItem value='CANCELLED'>CANCELLED</MenuItem>
            </Select>
          </FormControl>

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

              {/* Offer Link Campaign Details Card */}
              {order.offerLink && (
                <div className='mt-6 p-4 rounded-xl border border-orange-200 bg-[#FFF8F5] text-slate-800 shadow-sm'>
                  <Typography variant='subtitle2' className='font-bold text-[#FF671F] flex items-center gap-1.5 mb-3'>
                    <i className='tabler-link text-lg' />
                    Offer Link Promotion Campaign
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='caption' className='text-slate-500 font-medium block'>Campaign Title</Typography>
                      <Typography variant='body2' className='font-extrabold text-slate-800 text-base'>
                        {order.offerLink.title}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant='caption' className='text-slate-500 font-medium block'>Offer Price</Typography>
                      <Typography variant='body2' className='font-black text-emerald-600 text-base'>
                        ₹{Number(order.offerLink.offerPrice).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant='caption' className='text-slate-500 font-medium block'>Original Price</Typography>
                      <Typography variant='body2' className='font-bold text-slate-400 line-through text-sm'>
                        ₹{Number(order.offerLink.salePrice).toFixed(2)}
                      </Typography>
                    </Grid>
                    {order.referralCode && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant='caption' className='text-slate-500 font-medium block'>Referred By Partner</Typography>
                        <Chip label={order.referralCode} size='small' className='bg-blue-100 text-blue-800 font-bold' />
                      </Grid>
                    )}
                  </Grid>
                </div>
              )}

              {/* Devotees List */}
              {Array.isArray(order.devotees) && order.devotees.length > 0 && (
                <div className='mt-6'>
                  <Divider className='mb-4' />
                  <Typography variant='subtitle1' className='font-bold mb-3 flex items-center gap-2 text-slate-800'>
                    <i className='tabler-users text-lg text-[#FF671F]' />
                    Booked Devotees ({order.devotees.length})
                  </Typography>
                  <div className='grid grid-cols-1 gap-3'>
                    {(order.devotees as any[]).map((d, i) => (
                      <div key={d.id || i} className='p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
                        <div>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <Typography className='font-bold text-slate-900 text-base'>
                              {i + 1}. {d.name}
                            </Typography>
                            {d.nameLocal && (
                              <Typography variant='caption' className='text-slate-500 font-medium'>
                                ({d.nameLocal})
                              </Typography>
                            )}
                            {d.isPrimary && (
                              <Chip label='Primary Devotee' color='primary' size='small' className='h-5 text-[10px] font-bold' />
                            )}
                          </div>
                          <Typography variant='caption' className='text-slate-600 block mt-1.5 text-xs'>
                            Gotra: <strong className='text-slate-800 font-bold'>{d.gotra || '—'}</strong> · DOB: <strong className='text-slate-800 font-bold'>{d.dob || '—'}</strong>
                          </Typography>
                        </div>
                        <div className='text-left sm:text-right text-xs text-slate-700 font-semibold space-y-0.5'>
                          {d.phone && <div className='font-mono font-bold text-indigo-950'>📱 {d.phone}</div>}
                          {d.email && <div className='text-slate-600'>✉️ {d.email}</div>}
                        </div>
                      </div>
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
          <Card className='mb-6'>
            <CardHeader title='💳 Payment Information' subheader='Gateway transaction details & breakdown' />
            <CardContent className='flex flex-col gap-3'>
              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                <Typography variant='body2' className='text-textSecondary font-medium'>Payment Status</Typography>
                <Chip
                  label={order.paymentStatus || 'PENDING'}
                  color={STATUS_COLORS[order.paymentStatus] || 'warning'}
                  size='small'
                  className='font-bold'
                />
              </div>

              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                <Typography variant='body2' className='text-textSecondary font-medium'>Payment Method</Typography>
                <Chip
                  label={order.paymentMethod || (order.razorpayPaymentId || order.razorpayOrderId ? 'Online (Razorpay)' : 'Direct Booking')}
                  color='primary'
                  size='small'
                  variant='outlined'
                  className='font-bold'
                />
              </div>

              {order.paymentDetails?.vpa && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>UPI VPA ID</Typography>
                  <Typography variant='body2' className='font-mono font-bold text-slate-700 dark:text-slate-300'>
                    {order.paymentDetails.vpa}
                  </Typography>
                </div>
              )}

              {order.paymentDetails?.card && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Card Details</Typography>
                  <Typography variant='body2' className='font-bold text-slate-700 dark:text-slate-300'>
                    {order.paymentDetails.card.network} {order.paymentDetails.card.type?.toUpperCase()} ****{order.paymentDetails.card.last4}
                  </Typography>
                </div>
              )}

              {order.paymentDetails?.bank && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Bank Name</Typography>
                  <Typography variant='body2' className='font-bold text-slate-700 dark:text-slate-300'>
                    {order.paymentDetails.bank}
                  </Typography>
                </div>
              )}

              {order.paymentDetails?.wallet && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Wallet Provider</Typography>
                  <Typography variant='body2' className='font-bold text-slate-700 dark:text-slate-300'>
                    {order.paymentDetails.wallet}
                  </Typography>
                </div>
              )}

              {order.paymentDetails?.feeRupees !== undefined && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Gateway Fee & Tax</Typography>
                  <Typography variant='caption' className='font-mono text-slate-600 dark:text-slate-400'>
                    Fee: ₹{order.paymentDetails.feeRupees.toFixed(2)} (Tax: ₹{(order.paymentDetails.taxRupees || 0).toFixed(2)})
                  </Typography>
                </div>
              )}

              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                <Typography variant='body2' className='text-textSecondary font-medium'>Total Amount Paid</Typography>
                <Typography variant='subtitle1' className='font-black text-emerald-600 dark:text-emerald-400'>
                  ₹{Number(order.amountPaid || order.totalAmount || order.price || order.amount || 0).toFixed(2)}
                </Typography>
              </div>

              {order.gstPercentage !== undefined && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>GST Rate</Typography>
                  <Typography variant='body2' className='font-bold'>
                    {order.gstPercentage}% ({order.gstInclusive ? 'Inclusive' : 'Exclusive'})
                  </Typography>
                </div>
              )}

              {order.razorpayOrderId && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Razorpay Order ID</Typography>
                  <code className='px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold'>
                    {order.razorpayOrderId}
                  </code>
                </div>
              )}

              {(order.razorpayPaymentId || order.paymentId) && (
                <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Razorpay Payment ID</Typography>
                  <code className='px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs font-bold'>
                    {order.razorpayPaymentId || order.paymentId}
                  </code>
                </div>
              )}

              {order.ipAddress && (
                <div className='flex justify-between items-center'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>Customer IP</Typography>
                  <Typography variant='caption' className='font-mono font-bold'>
                    {order.ipAddress}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Notification & On-Demand Dispatch Card */}
          <Card className='mb-6 border border-slate-100 shadow-sm'>
            <CardHeader
              title='📱 Devotee Confirmation SMS'
              subheader='Send or re-send DLT booking confirmation message'
            />
            <CardContent className='flex flex-col gap-3'>
              {smsResult && (
                <Alert severity={smsResult.type} className='text-xs'>
                  {smsResult.msg}
                </Alert>
              )}

              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 text-xs'>
                <span className='text-slate-500 font-medium'>Devotee Mobile</span>
                <span className='font-mono font-bold text-slate-800 dark:text-slate-200'>
                  {order.devotees?.[0]?.phone || order.devoteePhone || order.customerPhone || order.user?.phone || 'Not provided'}
                </span>
              </div>

              <Button
                variant='contained'
                disabled={sendingSms || !(order.devotees?.[0]?.phone || order.devoteePhone || order.customerPhone || order.user?.phone)}
                onClick={handleResendSms}
                style={{ backgroundColor: '#006241' }}
                className='font-bold text-white flex items-center justify-center gap-2 py-2 mt-1'
              >
                {sendingSms ? <CircularProgress size={16} color='inherit' /> : <span>📱</span>}
                <span>{sendingSms ? 'Dispatching SMS...' : 'Send Confirmation SMS Now'}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Telemetry & Marketing Metadata Card */}
          <Card className='mb-6 border border-slate-100 shadow-sm'>
            <CardHeader title='📡 Devotee Telemetry & Device Metadata' subheader='Device, Browser, IP & Geolocation info for marketing next offers' />
            <CardContent className='flex flex-col gap-3'>
              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                <Typography variant='body2' className='text-textSecondary font-medium'>Device & OS</Typography>
                <Typography variant='body2' className='font-bold text-slate-800 dark:text-slate-200' title={order.userAgent || ''}>
                  {parseUserAgent(order.userAgent)}
                </Typography>
              </div>

              {order.userAgent && (
                <div className='pb-2 border-b border-slate-100 dark:border-slate-800'>
                  <Typography variant='caption' className='text-slate-400 block mb-1 font-semibold'>User-Agent Browser String</Typography>
                  <Typography variant='caption' className='font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all block bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700'>
                    {order.userAgent}
                  </Typography>
                </div>
              )}

              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                <Typography variant='body2' className='text-textSecondary font-medium'>User IP Address</Typography>
                <Typography variant='body2' className='font-mono font-bold text-slate-700 dark:text-slate-300'>
                  {order.ipAddress || '—'}
                </Typography>
              </div>

              <div className='flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800'>
                <Typography variant='body2' className='text-textSecondary font-medium'>IP Geolocation</Typography>
                <Typography variant='body2' className='font-bold text-slate-700 dark:text-slate-300'>
                  {order.ipLocation || '—'}
                </Typography>
              </div>

              {order.gpsLocation && (
                <div className='flex justify-between items-center'>
                  <Typography variant='body2' className='text-textSecondary font-medium'>GPS Location</Typography>
                  <Typography variant='body2' className='font-mono text-blue-600 font-bold'>
                    <a href={`https://www.google.com/maps?q=${order.gpsLocation}`} target='_blank' rel='noreferrer' className='hover:underline flex items-center gap-1'>
                      📍 {order.gpsLocation} (Maps ↗)
                    </a>
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>

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
