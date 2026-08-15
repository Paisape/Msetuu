'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

type Devotee = {
  id: string
  name: string
  nameLocal: string | null
  phone: string
  gotra: string | null
  dob: string | null
  email: string | null // WhatsApp No
  createdAt: string
}

type OrderDevotee = {
  name: string
  nameLocal: string | null
  phone: string
  gotra: string | null
  dob: string | null
  email: string | null
}

type Order = {
  id: string
  amount: string
  paymentId: string | null
  referralCode: string | null
  reconciledStatus: string
  createdAt: string
  ipAddress: string | null
  ipLocation: string | null
  gpsLocation: string | null
  offerLink: {
    title: string
  }
  devotees: OrderDevotee[]
}

export default function DevoteeDetailClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'
  const id = params?.id

  const [devotee, setDevotee] = useState<Devotee | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Order Detail dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/devotees/${id}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load devotee profile.')
        setDevotee(data.devotee)
        setOrders(data.orders)
      })
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : 'An error occurred.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-12'>
        <CircularProgress style={{ color: '#FF671F' }} />
      </Box>
    )
  }

  if (errorMsg || !devotee) {
    return (
      <div className='p-6 max-w-4xl mx-auto'>
        <Alert severity='error' className='mb-4'>{errorMsg || 'Devotee profile not found.'}</Alert>
        <Button variant='outlined' onClick={() => router.push(`/${locale}/apps/mandir-setu/devotees`)}>
          Back to Directory
        </Button>
      </div>
    )
  }

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold text-slate-800 mb-1'>
            👤 Devotee Profile Info
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Detailed overview of registered devotee and completed booking receipts.
          </Typography>
        </div>
        <Button
          variant='outlined'
          onClick={() => router.push(`/${locale}/apps/mandir-setu/devotees`)}
          className='border-slate-300 text-slate-700 font-bold'
        >
          Back to List
        </Button>
      </div>

      {/* Devotee Info Card */}
      <Card className='p-6 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 bg-white'>
        <div className='space-y-1'>
          <span className='text-xs text-slate-400 font-bold uppercase tracking-wider block'>Devotee Name</span>
          <Typography variant='h5' className='font-extrabold text-slate-700'>
            {devotee.name}
            {devotee.nameLocal && <span className='block text-sm font-normal text-slate-400'>({devotee.nameLocal})</span>}
          </Typography>
        </div>

        <div className='space-y-1'>
          <span className='text-xs text-slate-400 font-bold uppercase tracking-wider block'>Mobile Phone Number</span>
          <Typography variant='h6' className='font-bold text-slate-700'>
            {devotee.phone || '—'}
          </Typography>
        </div>

        <div className='space-y-1'>
          <span className='text-xs text-slate-400 font-bold uppercase tracking-wider block'>Gotra</span>
          <Typography variant='body1' className='font-semibold text-slate-700'>
            {devotee.gotra || '—'}
          </Typography>
        </div>

        <div className='space-y-1'>
          <span className='text-xs text-slate-400 font-bold uppercase tracking-wider block'>Date of Birth</span>
          <Typography variant='body1' className='font-semibold text-slate-700'>
            {devotee.dob || '—'}
          </Typography>
        </div>

        <div className='space-y-1'>
          <span className='text-xs text-slate-400 font-bold uppercase tracking-wider block'>WhatsApp Number</span>
          <Typography variant='body1' className='font-semibold text-slate-700'>
            {devotee.email || '—'}
          </Typography>
        </div>

        <div className='space-y-1'>
          <span className='text-xs text-slate-400 font-bold uppercase tracking-wider block'>Profile Created Date</span>
          <Typography variant='body1' className='font-semibold text-slate-700'>
            {new Date(devotee.createdAt).toLocaleString()}
          </Typography>
        </div>
      </Card>

      {/* Devotee Orders list */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Typography variant='h5' className='font-bold text-slate-800 mb-2'>
          📋 Booking Orders History
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          List of campaign offerings completed by this devotee.
        </Typography>

        <TableContainer className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold'>Date</TableCell>
                <TableCell className='font-bold'>Campaign Offer Name</TableCell>
                <TableCell className='font-bold'>Amount Paid</TableCell>
                <TableCell className='font-bold'>Payment Transaction ID</TableCell>
                <TableCell className='font-bold text-center'>Reconciled</TableCell>
                <TableCell className='font-bold text-right' style={{ width: 80 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center' className='py-8 text-slate-400'>
                    No completed offerings recorded for this devotee.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover className='hover:bg-slate-50/30'>
                    <TableCell className='text-slate-500'>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='font-semibold text-slate-700'>
                      {order.offerLink?.title || 'Unknown Campaign'}
                    </TableCell>
                    <TableCell className='font-bold text-slate-800'>₹{Number(order.amount).toFixed(2)}</TableCell>
                    <TableCell className='text-xs font-mono text-slate-500'>{order.paymentId || '—'}</TableCell>
                    <TableCell className='text-center'>
                      <Chip 
                        label={order.reconciledStatus.replace('RECONCILED_', '')} 
                        size='small'
                        color={order.reconciledStatus.startsWith('RECONCILED') ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell className='text-right'>
                      <IconButton 
                        size='small' 
                        onClick={() => handleOpenOrderDetails(order)}
                        style={{ color: '#FF671F' }}
                        aria-label='View Booking Details'
                      >
                        <i className='tabler-eye text-lg' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Order Details dialog (reused popup card) */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          className: 'rounded-2xl p-4'
        }}
      >
        <DialogTitle className='font-bold text-xl text-slate-800 flex justify-between items-center'>
          <span>Booking Order Details</span>
          <IconButton size='small' onClick={() => setDetailOpen(false)}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className='space-y-4 text-sm'>
          {selectedOrder && (
            <>
              <div className='grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100'>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>ORDER ID</span>
                  <span className='font-mono font-bold text-slate-700'>{selectedOrder.id}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>DATE</span>
                  <span className='font-bold text-slate-700'>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>AMOUNT PAID</span>
                  <span className='font-bold text-slate-800 text-base'>₹{Number(selectedOrder.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>GATEWAY TRANSACTION ID</span>
                  <span className='font-mono font-bold text-slate-700'>{selectedOrder.paymentId || '—'}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>REFERRAL APPLIED</span>
                  <span className='font-bold text-slate-700'>{selectedOrder.referralCode || 'None'}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>RECONCILIATION STATUS</span>
                  <Chip 
                    label={selectedOrder.reconciledStatus} 
                    size='small'
                    color={selectedOrder.reconciledStatus.startsWith('RECONCILED') ? 'success' : 'default'}
                  />
                </div>
                {selectedOrder.ipAddress && (
                  <div>
                    <span className='text-xs text-slate-400 font-bold block'>🌐 USER IP ADDRESS</span>
                    <span className='font-mono font-bold text-slate-700'>{selectedOrder.ipAddress}</span>
                  </div>
                )}
                {selectedOrder.ipLocation && (
                  <div>
                    <span className='text-xs text-slate-400 font-bold block'>📍 IP LOCATION</span>
                    <span className='font-bold text-slate-700'>{selectedOrder.ipLocation}</span>
                  </div>
                )}
                {selectedOrder.gpsLocation && (
                  <div className='col-span-2'>
                    <span className='text-xs text-slate-400 font-bold block'>🛰️ GPS COORDINATES</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.gpsLocation}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5'
                    >
                      {selectedOrder.gpsLocation} (Open in Google Maps ↗)
                    </a>
                  </div>
                )}
              </div>

              <div>
                <Typography variant='subtitle2' className='font-bold text-slate-800 mb-2'>
                  👥 Registered Devotees ({selectedOrder.devotees?.length || 0})
                </Typography>
                <div className='space-y-3'>
                  {selectedOrder.devotees?.map((dev, idx) => (
                    <div key={idx} className='p-3 bg-white border border-slate-150 rounded-xl flex flex-col gap-1 shadow-sm'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-slate-700'>
                          #{idx + 1} {dev.name}
                          {dev.nameLocal ? ` (${dev.nameLocal})` : ''}
                        </span>
                        {idx === 0 && <Chip label='Primary Contact' size='small' className='bg-orange-50 text-orange-700 border-orange-100 border' />}
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-xs text-slate-500 mt-1'>
                        <div>📞 Mobile: <strong>{dev.phone || '—'}</strong></div>
                        <div>🏵️ Gotra: <strong>{dev.gotra || '—'}</strong></div>
                        <div>🎂 DOB: <strong>{dev.dob || '—'}</strong></div>
                        <div>💬 WhatsApp: <strong>{dev.email || '—'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} style={{ color: '#FF671F' }} className='font-bold'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
