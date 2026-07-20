'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import { useSession } from 'next-auth/react'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import WriteReviewDialog from '@/components/WriteReviewDialog'

type MyOrder = {
  type: string
  id: string
  label: string
  amount: number | null
  status: string
  paymentStatus: string | null
  createdAt: string
  videoUrl?: string | null
  videoUploadedAt?: string | null
  videoExpired?: boolean
  targetId?: string | null
}

const REVIEWABLE_TYPES = new Set(['CHADHAVA', 'EPUJA', 'KUNDLI', 'JYOTISH', 'ECOMMERCE'])

type TrailEntry = { id: string; status: string; note?: string | null; createdAt: string; actorName: string }

const MODULE_LABEL: Record<string, string> = {
  CHADHAVA: 'Chadhava',
  EPUJA: 'E-Puja',
  JYOTISH: 'Jyotish',
  KUNDLI: 'Kundli',
  ECOMMERCE: 'Ecommerce',
  YATRA: 'Yatra'
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
  CANCELLED: 'error'
}

const MyOrdersPage = () => {
  const { data: session, status: sessionStatus } = useSession()
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailLoading, setTrailLoading] = useState(false)

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      if (sessionStatus === 'unauthenticated') setLoading(false)

      return
    }

    fetch('/api/my-orders')
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load your orders.')
        setOrders(Array.isArray(data) ? data : [])
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load your orders.'))
      .finally(() => setLoading(false))
  }, [sessionStatus])

  const toggleTrail = async (order: MyOrder) => {
    const rowKey = `${order.type}-${order.id}`

    if (expandedId === rowKey) {
      setExpandedId(null)

      return
    }

    setExpandedId(rowKey)
    setTrailLoading(true)

    try {
      const res = await fetch(`/api/orders/trail?type=${order.type}&id=${order.id}`)
      const data = await res.json().catch(() => [])

      setTrail(Array.isArray(data) ? data : [])
    } finally {
      setTrailLoading(false)
    }
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-12'>
          <Typography variant='h2' className='font-bold mb-4 galaxy-glow-text' style={{ color: '#006241' }}>
            My Orders
          </Typography>
          <Typography variant='body1' style={{ color: '#374151' }}>
            Track every Chadhava, E-Puja, Jyotish, Kundli, Ecommerce and Yatra order you've placed.
          </Typography>
        </div>

        {sessionStatus === 'unauthenticated' && (
          <Alert severity='info'>
            Please <Link href='/login' className='font-semibold'>log in</Link> to see your orders.
          </Alert>
        )}

        {errorMsg && <Alert severity='error'>{errorMsg}</Alert>}

        {loading ? (
          <div className='text-center p-12'>
            <CircularProgress />
          </div>
        ) : sessionStatus === 'authenticated' && orders.length === 0 ? (
          <Card className='galaxy-card p-8 text-center'>
            <Typography style={{ color: '#374151' }}>You haven&apos;t placed any orders yet.</Typography>
          </Card>
        ) : (
          <div className='flex flex-col gap-4'>
            {orders.map(order => {
              const rowKey = `${order.type}-${order.id}`

              return (
                <Card key={rowKey} className='galaxy-card'>
                  <CardContent>
                    <div className='flex items-center justify-between flex-wrap gap-3'>
                      <div>
                        <Typography variant='caption' style={{ color: '#10b981' }} className='font-semibold'>
                          {MODULE_LABEL[order.type]}
                        </Typography>
                        <Typography variant='h6' className='font-bold' style={{ color: '#047857' }}>
                          {order.label}
                        </Typography>
                        <Typography variant='caption' style={{ color: '#6b7280' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          {order.amount || order.amount === 0 ? ` · ₹${order.amount}` : ''}
                        </Typography>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Chip size='small' label={order.status.replace(/_/g, ' ')} color={STATUS_COLORS[order.status] || 'default'} />
                        <Button size='small' onClick={() => toggleTrail(order)}>
                          {expandedId === rowKey ? 'Hide Trail' : 'View Trail'}
                        </Button>
                      </div>
                    </div>

                    {order.paymentStatus === 'PAID' && order.targetId && REVIEWABLE_TYPES.has(order.type) && (
                      <div className='mt-3'>
                        <WriteReviewDialog
                          orderType={order.type as 'CHADHAVA' | 'EPUJA' | 'KUNDLI' | 'JYOTISH' | 'ECOMMERCE'}
                          orderId={order.id}
                          itemLabel={order.label}
                        />
                      </div>
                    )}

                    {order.videoUrl && !order.videoExpired && (
                      <Alert severity='success' className='mt-3'>
                        Your offering video is ready —{' '}
                        <a href={order.videoUrl} target='_blank' rel='noreferrer' className='font-semibold'>
                          watch / download it here
                        </a>
                        . It will be removed from this page 48 hours after upload, so please save it now.
                      </Alert>
                    )}
                    {order.videoExpired && (
                      <Alert severity='info' className='mt-3'>
                        Your offering video was available for 48 hours after upload and has since been removed. It was emailed to you at upload time.
                      </Alert>
                    )}

                    <Collapse in={expandedId === rowKey}>
                      <div className='mt-4 pt-4' style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                        {trailLoading ? (
                          <CircularProgress size={18} />
                        ) : trail.length === 0 ? (
                          <Typography variant='body2' style={{ color: '#6b7280' }}>
                            No status history yet.
                          </Typography>
                        ) : (
                          <div className='flex flex-col gap-2'>
                            {trail.map(entry => (
                              <div key={entry.id} className='flex items-center gap-3'>
                                <Chip size='small' label={entry.status.replace(/_/g, ' ')} color={STATUS_COLORS[entry.status] || 'default'} />
                                <Typography variant='caption' style={{ color: '#6b7280' }}>
                                  {new Date(entry.createdAt).toLocaleString('en-IN')}
                                </Typography>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Collapse>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrdersPage
