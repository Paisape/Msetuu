'use client'

import { useState, useEffect, useCallback } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'

type Slab = {
  id: string
  pointsRequired: number
  product: { id: string; name: string; image: string; price: number }
}

type Redemption = {
  id: string
  pointsSpent: number
  status: 'PENDING' | 'FULFILLED' | 'REJECTED'
  createdAt: string
  slab: { product: { name: string; image: string } }
}

type PointsTransaction = { id: string; amount: number; reason: string; createdAt: string }

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  FULFILLED: 'success',
  REJECTED: 'error'
}

const RewardsSection = () => {
  const { data: session } = useSession()
  const [points, setPoints] = useState(0)
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [slabs, setSlabs] = useState<Slab[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [redeemingSlab, setRedeemingSlab] = useState<Slab | null>(null)
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)

    try {
      const slabsRes = await fetch('/api/geotag/redemption-slabs')
      const slabsData = await slabsRes.json().catch(() => [])

      if (Array.isArray(slabsData)) setSlabs(slabsData)

      if (session?.user) {
        const [pointsRes, redemptionsRes] = await Promise.all([
          fetch('/api/geotag/points'),
          fetch('/api/geotag/redemptions')
        ])

        const pointsData = await pointsRes.json().catch(() => null)
        const redemptionsData = await redemptionsRes.json().catch(() => [])

        if (pointsData) {
          setPoints(pointsData.points ?? 0)
          setTransactions(pointsData.transactions ?? [])
        }

        if (Array.isArray(redemptionsData)) setRedemptions(redemptionsData)
      }
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleRedeem = async () => {
    if (!redeemingSlab) return
    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/geotag/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slabId: redeemingSlab.id, shippingAddress: address })
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to redeem.')

      setMessage({ type: 'success', text: `Redeemed! We'll ship your ${redeemingSlab.product.name} soon.` })
      setRedeemingSlab(null)
      setAddress('')
      loadAll()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to redeem.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <CircularProgress style={{ color: '#10b981' }} />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <Typography className='text-center py-16' style={{ color: '#6b7280' }}>
        Log in to see your points balance and redeem rewards.
      </Typography>
    )
  }

  return (
    <div>
      {message && (
        <Alert severity={message.type} className='mb-6' onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Balance */}
      <Card
        className='p-8 text-center mb-10'
        style={{ background: 'linear-gradient(135deg,#006241 0%,#10b981 100%)' }}
      >
        <Typography className='text-white/80 font-semibold'>Your Points Balance</Typography>
        <Typography variant='h2' className='font-bold text-white'>
          {points}
        </Typography>
      </Card>

      {/* Reward tiers */}
      <Typography variant='h5' className='font-bold mb-4' style={{ color: '#006241' }}>
        Redeem Your Points
      </Typography>

      {slabs.length === 0 ? (
        <Typography className='mb-10' style={{ color: '#6b7280' }}>
          No rewards configured yet — check back soon.
        </Typography>
      ) : (
        <Grid container spacing={4} className='mb-10'>
          {slabs.map(slab => {
            const eligible = points >= slab.pointsRequired

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={slab.id}>
                <Card className='h-full flex flex-col border border-slate-200/60 shadow-sm'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slab.product.image} alt={slab.product.name} className='w-full h-40 object-cover' />
                  <CardContent className='flex flex-col gap-2 flex-grow'>
                    <Typography className='font-bold'>{slab.product.name}</Typography>
                    <Typography className='font-bold' style={{ color: '#006241' }}>
                      {slab.pointsRequired} points
                    </Typography>
                    <Button
                      variant='contained'
                      disabled={!eligible}
                      onClick={() => setRedeemingSlab(slab)}
                      className='mt-auto font-semibold'
                      style={{ textTransform: 'none' }}
                    >
                      {eligible ? 'Redeem Now' : `Need ${slab.pointsRequired - points} more points`}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Redemption history */}
      {redemptions.length > 0 && (
        <>
          <Typography variant='h6' className='font-bold mb-3' style={{ color: '#006241' }}>
            My Redemptions
          </Typography>
          <div className='flex flex-col gap-2 mb-10'>
            {redemptions.map(r => (
              <Card key={r.id} className='p-3 flex items-center justify-between border border-slate-200/60'>
                <div>
                  <Typography className='font-semibold'>{r.slab.product.name}</Typography>
                  <Typography variant='caption' style={{ color: '#6b7280' }}>
                    {r.pointsSpent} points · {new Date(r.createdAt).toLocaleDateString()}
                  </Typography>
                </div>
                <Chip size='small' label={r.status} color={STATUS_COLOR[r.status]} />
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Points ledger */}
      {transactions.length > 0 && (
        <>
          <Typography variant='h6' className='font-bold mb-3' style={{ color: '#006241' }}>
            Points History
          </Typography>
          <div className='flex flex-col gap-1'>
            {transactions.map(t => (
              <div key={t.id} className='flex justify-between text-sm py-1.5 border-b border-slate-100'>
                <span style={{ color: '#374151' }}>{t.reason}</span>
                <span className='font-bold' style={{ color: t.amount >= 0 ? '#10b981' : '#ef4444' }}>
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Redeem confirmation dialog */}
      <Dialog open={!!redeemingSlab} onClose={() => setRedeemingSlab(null)} maxWidth='sm' fullWidth>
        <DialogTitle className='font-bold'>Redeem {redeemingSlab?.product.name}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <Typography style={{ color: '#6b7280' }}>
            This will spend {redeemingSlab?.pointsRequired} points. Please provide your shipping address.
          </Typography>
          <TextField
            label='Shipping Address'
            multiline
            rows={3}
            fullWidth
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedeemingSlab(null)} color='inherit'>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleRedeem} disabled={submitting || !address.trim()}>
            {submitting ? <CircularProgress size={20} /> : 'Confirm Redemption'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default RewardsSection
