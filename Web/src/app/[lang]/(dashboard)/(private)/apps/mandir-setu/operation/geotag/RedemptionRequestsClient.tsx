'use client'

import { useState, useEffect, useMemo } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

type RedemptionRequest = {
  id: string
  pointsSpent: number
  status: 'PENDING' | 'FULFILLED' | 'REJECTED'
  shippingAddress: string | null
  createdAt: string
  slab: { product: { name: string; image: string } }
  user?: { name: string; email: string; phone: string }
}

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  FULFILLED: 'success',
  REJECTED: 'error'
}

const RedemptionRequestsClient = () => {
  const [requests, setRequests] = useState<RedemptionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING')

  const fetchRequests = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/geotag/redemptions?all=1')
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to load redemption requests.')
      setRequests(data)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleReview = async (id: string, status: 'FULFILLED' | 'REJECTED') => {
    setActingId(id)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/geotag/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to update this request.')
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, ...data } : r)))
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setActingId(null)
    }
  }

  const filtered = useMemo(() => (tab === 'ALL' ? requests : requests.filter(r => r.status === 'PENDING')), [requests, tab])

  if (loading) {
    return (
      <div className='p-12 text-center'>
        <CircularProgress size={24} />
      </div>
    )
  }

  return (
    <div>
      {errorMsg && (
        <Alert severity='error' className='mb-4' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} className='mb-4'>
        <Tab label={`Pending (${requests.filter(r => r.status === 'PENDING').length})`} value='PENDING' />
        <Tab label='All' value='ALL' />
      </Tabs>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requested</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Reward</TableCell>
                <TableCell>Points Spent</TableCell>
                <TableCell>Shipping Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No redemption requests here.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.user?.name || 'Unknown'}
                      <Typography variant='caption' className='block text-textSecondary'>
                        {r.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.slab.product.name}</TableCell>
                    <TableCell>{r.pointsSpent}</TableCell>
                    <TableCell className='max-w-[200px]'>{r.shippingAddress || '—'}</TableCell>
                    <TableCell>
                      <Chip size='small' label={r.status} color={STATUS_COLOR[r.status]} />
                    </TableCell>
                    <TableCell align='right'>
                      {r.status === 'PENDING' ? (
                        <div className='flex gap-2 justify-end'>
                          <Button size='small' variant='contained' color='success' disabled={actingId === r.id} onClick={() => handleReview(r.id, 'FULFILLED')}>
                            Mark Fulfilled
                          </Button>
                          <Button size='small' variant='outlined' color='error' disabled={actingId === r.id} onClick={() => handleReview(r.id, 'REJECTED')}>
                            Reject &amp; Refund
                          </Button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  )
}

export default RedemptionRequestsClient
