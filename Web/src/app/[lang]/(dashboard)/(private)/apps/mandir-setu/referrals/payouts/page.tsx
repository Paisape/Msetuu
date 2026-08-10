'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

type Payout = {
  id: string
  userId: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
  bankHolderName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  upiId?: string | null
  adminNotes?: string | null
  createdAt: string
  user: {
    name?: string | null
    email?: string | null
    phone?: string | null
  }
}

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PENDING: 'warning',
  APPROVED: 'primary',
  PAID: 'success',
  REJECTED: 'error'
}

export default function PayoutRequestsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog controls
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [dialogAction, setDialogAction] = useState<'APPROVE' | 'REJECT' | 'PAY' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadPayouts = () => {
    setLoading(true)
    fetch('/api/admin/referrals/payouts')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPayouts(data.payouts || [])
        } else {
          throw new Error(data.error || 'Failed to load payouts.')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPayouts()
  }, [])

  const handleOpenDialog = (payout: Payout, action: 'APPROVE' | 'REJECT' | 'PAY') => {
    setSelectedPayout(payout)
    setDialogAction(action)
    setAdminNotes(payout.adminNotes || '')
  }

  const handleCloseDialog = () => {
    setSelectedPayout(null)
    setDialogAction(null)
    setAdminNotes('')
  }

  const handleSubmitAction = async () => {
    if (!selectedPayout || !dialogAction) return
    setSubmitting(true)

    let targetStatus = ''
    if (dialogAction === 'APPROVE') targetStatus = 'APPROVED'
    if (dialogAction === 'REJECT') targetStatus = 'REJECTED'
    if (dialogAction === 'PAY') targetStatus = 'PAID'

    try {
      const res = await fetch(`/api/admin/referrals/payouts/${selectedPayout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, adminNotes })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      handleCloseDialog()
      loadPayouts()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='p-12 text-center'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <Typography variant='h4' className='font-bold mb-1'>
            Referral Payout Requests
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Review and settle customer withdrawal requests to bank accounts or UPI IDs.
          </Typography>
        </div>
      </div>

      {error && <Alert severity='error' className='mb-6'>{error}</Alert>}

      <Card>
        <CardHeader title='Withdrawal Logs' />
        <CardContent>
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Admin Notes</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
                      No payout requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Typography className='font-bold' variant='body2'>
                          {row.user?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' className='block'>
                          {row.user?.email || ''} · {row.user?.phone || ''}
                        </Typography>
                      </TableCell>
                      <TableCell className='font-semibold text-emerald-600'>
                        ₹{row.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          <strong>Name:</strong> {row.bankHolderName}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' className='block'>
                          <strong>Bank:</strong> {row.bankName} · <strong>A/C:</strong> {row.accountNumber}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' className='block'>
                          <strong>IFSC:</strong> {row.ifscCode} {row.upiId ? `· UPI: ${row.upiId}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(row.createdAt).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={row.status}
                          color={STATUS_COLORS[row.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell style={{ maxWidth: 200, wordBreak: 'break-all' }}>
                        {row.adminNotes || <Typography variant='caption' color='text.secondary'>—</Typography>}
                      </TableCell>
                      <TableCell align='right'>
                        {row.status === 'PENDING' && (
                          <div className='flex gap-1 justify-end'>
                            <Button
                              size='small'
                              variant='contained'
                              color='primary'
                              onClick={() => handleOpenDialog(row, 'APPROVE')}
                            >
                              Approve
                            </Button>
                            <Button
                              size='small'
                              variant='outlined'
                              color='error'
                              onClick={() => handleOpenDialog(row, 'REJECT')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {row.status === 'APPROVED' && (
                          <div className='flex gap-1 justify-end'>
                            <Button
                              size='small'
                              variant='contained'
                              color='success'
                              onClick={() => handleOpenDialog(row, 'PAY')}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size='small'
                              variant='outlined'
                              color='error'
                              onClick={() => handleOpenDialog(row, 'REJECT')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {(row.status === 'PAID' || row.status === 'REJECTED') && (
                          <Typography variant='caption' color='text.secondary'>
                            Settled
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Confirmation & Actions Dialog */}
      <Dialog open={!!selectedPayout} onClose={handleCloseDialog} maxWidth='xs' fullWidth>
        <DialogTitle>
          {dialogAction === 'APPROVE' && 'Approve Payout Request'}
          {dialogAction === 'REJECT' && 'Reject Payout Request (Refunds Wallet)'}
          {dialogAction === 'PAY' && 'Confirm Payout Completed'}
        </DialogTitle>
        <DialogContent className='pt-2 flex flex-col gap-4'>
          <Typography variant='body2'>
            Are you sure you want to {dialogAction?.toLowerCase()} the request of{' '}
            <strong>₹{selectedPayout?.amount.toFixed(2)}</strong> for{' '}
            <strong>{selectedPayout?.user?.name}</strong>?
          </Typography>
          <TextField
            label='Admin Notes / Transaction Ref / Reject Reason'
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            className='mt-2'
            placeholder={
              dialogAction === 'REJECT'
                ? 'Reason for rejection (e.g. Duplicate account / invalid IFSC)'
                : 'Transaction reference ID / bank log notes'
            }
          />
        </DialogContent>
        <DialogActions className='p-4'>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAction}
            variant='contained'
            disabled={submitting}
            color={
              dialogAction === 'REJECT' ? 'error' : dialogAction === 'PAY' ? 'success' : 'primary'
            }
          >
            {submitting ? <CircularProgress size={24} color='inherit' /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
