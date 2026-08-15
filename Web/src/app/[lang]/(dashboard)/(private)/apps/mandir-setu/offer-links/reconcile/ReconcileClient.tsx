'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

type RunLog = {
  id: string
  fileName: string
  gatewayType: string
  totalProcessed: number
  totalMatched: number
  totalDiscrepant: number
  createdAt: string
}

type Devotee = {
  id: string
  name: string
  nameLocal: string | null
  gotra: string
  dob: string
  phone: string
}

type Order = {
  id: string
  amount: string
  createdAt: string
  paymentId: string | null
  offerLink: { title: string }
  devotees: Devotee[]
}

export default function ReconcileClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submittingManual, setSubmittingManual] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [runs, setRuns] = useState<RunLog[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [gateway, setGateway] = useState('RAZORPAY')
  const [file, setFile] = useState<File | null>(null)

  // Manual Reconcile Dialog State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [manualTxnId, setManualTxnId] = useState('')
  const [manualNotes, setManualNotes] = useState('')

  const loadData = async () => {
    try {
      const res = await fetch('/api/offers/reconcile')
      if (!res.ok) throw new Error('Failed to load reconciliation logs.')
      const data = await res.json()
      setRuns(data.runs)
      setPendingOrders(data.pendingOrders)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('gateway', gateway)

      const res = await fetch('/api/offers/reconcile/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reconciliation failed.')

      setSuccessMsg(`Processed file "${data.fileName}": Reconciled ${data.totalMatched} orders, flagged ${data.totalDiscrepant} discrepancies.`)
      
      // Reset file input
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Refresh list
      await loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process file.')
    } finally {
      setUploading(false)
    }
  }

  const handleManualReconcile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return
    setSubmittingManual(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/offers/reconcile/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          paymentId: manualTxnId || null,
          notes: manualNotes,
          forceSuccess: true
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to manual reconcile.')

      setSuccessMsg(`Order successfully marked as PAID! ID: ${selectedOrder.id}`)
      setPendingOrders(pendingOrders.filter(o => o.id !== selectedOrder.id))
      setSelectedOrder(null)
      setManualTxnId('')
      setManualNotes('')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setSubmittingManual(false)
    }
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
      {/* CSV Settlement File Uploader */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Typography variant='h4' className='font-bold text-slate-800 mb-2'>
          📊 Payment Gateway Reconciliation
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          Reconcile checkouts automatically by uploading Razorpay or PhonePe payout transaction reports (CSV files).
        </Typography>

        {successMsg && <Alert severity='success' className='mb-4'>{successMsg}</Alert>}
        {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

        <form onSubmit={handleUploadSubmit} className='flex flex-col sm:flex-row gap-6 items-end'>
          <div className='flex-1 w-full'>
            <label className='block text-xs font-bold text-slate-500 mb-1.5'>Gateway Type</label>
            <Select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              fullWidth
              size='small'
              className='bg-white'
            >
              <MenuItem value='RAZORPAY'>Razorpay CSV Payouts</MenuItem>
              <MenuItem value='PHONEPE'>PhonePe Merchant Reports</MenuItem>
            </Select>
          </div>

          <div className='flex-1 w-full'>
            <label className='block text-xs font-bold text-slate-500 mb-1.5'>Upload Report File (CSV) *</label>
            <input
              type='file'
              accept='.csv'
              required
              ref={fileInputRef}
              onChange={handleFileChange}
              className='w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200'
            />
          </div>

          <Button
            type='submit'
            variant='contained'
            disabled={uploading || !file}
            style={{ backgroundColor: '#FF671F', height: '40px' }}
            className='font-bold text-white px-6 flex-shrink-0'
          >
            {uploading ? 'Processing File...' : 'Start Audit'}
          </Button>
        </form>
      </Card>

      {/* Unreconciled Pending Orders */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Typography variant='h5' className='font-bold text-slate-800 mb-2'>
          ⏳ Pending / Unpaid Orders
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          List of checkouts awaiting payment. Verify manually if webhooks failed but client paid.
        </Typography>

        <TableContainer className='border rounded-lg overflow-hidden max-h-[350px] overflow-y-auto'>
          <Table stickyHeader>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold'>Date</TableCell>
                <TableCell className='font-bold'>Campaign</TableCell>
                <TableCell className='font-bold'>Primary Devotee</TableCell>
                <TableCell className='font-bold'>Amount (₹)</TableCell>
                <TableCell className='font-bold'>Temporary Ref ID</TableCell>
                <TableCell className='font-bold text-right'>Audit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8 text-slate-400'>
                    No pending/unpaid orders found.
                  </TableCell>
                </TableRow>
              ) : (
                pendingOrders.map((order) => (
                  <TableRow key={order.id} className='hover:bg-slate-50/50'>
                    <TableCell className='text-slate-500'>
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className='font-semibold text-slate-700'>{order.offerLink.title}</TableCell>
                    <TableCell>
                      {order.devotees[0]?.name || 'N/A'}
                      {order.devotees[0]?.nameLocal ? ` (${order.devotees[0]?.nameLocal})` : ''}
                      {` `}({order.devotees[0]?.phone})
                    </TableCell>
                    <TableCell className='font-bold text-slate-800'>₹{Number(order.amount).toFixed(2)}</TableCell>
                    <TableCell className='text-xs font-mono text-slate-500'>{order.paymentId || 'None'}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='contained'
                        size='small'
                        onClick={() => setSelectedOrder(order)}
                        style={{ backgroundColor: '#006241' }}
                        className='font-bold text-white'
                      >
                        Force Settle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Reconciliation Run Logs */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Typography variant='h5' className='font-bold text-slate-800 mb-2'>
          📜 Previous Audit Runs Logs
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          Records of uploaded settlement files and matched transaction ratios.
        </Typography>

        <TableContainer className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold'>Execution Date</TableCell>
                <TableCell className='font-bold'>File Name</TableCell>
                <TableCell className='font-bold'>Gateway</TableCell>
                <TableCell className='font-bold text-center'>Processed Lines</TableCell>
                <TableCell className='font-bold text-center'>Auto Matched</TableCell>
                <TableCell className='font-bold text-center'>Discrepancies</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-8 text-slate-400'>
                    No reconciliation runs recorded.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id} className='hover:bg-slate-50/50'>
                    <TableCell className='text-slate-500'>
                      {new Date(run.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className='font-semibold text-slate-700'>{run.fileName}</TableCell>
                    <TableCell className='font-bold text-slate-600'>{run.gatewayType}</TableCell>
                    <TableCell className='text-center font-bold text-slate-600'>{run.totalProcessed}</TableCell>
                    <TableCell className='text-center font-bold text-emerald-700 bg-emerald-50/30'>{run.totalMatched}</TableCell>
                    <TableCell className='text-center font-bold text-red-700 bg-red-50/30'>{run.totalDiscrepant}</TableCell>
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

      {/* Manual Settle Dialog Popup */}
      <Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} fullWidth maxWidth='xs'>
        <form onSubmit={handleManualReconcile}>
          <DialogTitle className='font-bold text-slate-800 border-b pb-3.5'>
            Force Settle Pending Order
          </DialogTitle>
          <DialogContent className='pt-5 space-y-4'>
            {selectedOrder && (
              <div className='text-sm text-slate-600 bg-slate-50 p-3 rounded-lg'>
                Campaign: <strong>{selectedOrder.offerLink.title}</strong><br />
                Primary Devotee: <strong>{selectedOrder.devotees[0]?.name}{selectedOrder.devotees[0]?.nameLocal ? ` (${selectedOrder.devotees[0]?.nameLocal})` : ''}</strong><br />
                Amount Due: <strong className='text-slate-800'>₹{Number(selectedOrder.amount).toFixed(2)}</strong>
              </div>
            )}
            
            <TextField
              label='Gateway Payment ID / Txn ID'
              value={manualTxnId}
              onChange={(e) => setManualTxnId(e.target.value)}
              placeholder='e.g. pay_OpQ123RstUv'
              fullWidth
              variant='outlined'
            />

            <TextField
              label='Audit Notes / Reason *'
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder='e.g. Verified transaction manually from Razorpay payout dashboard.'
              required
              fullWidth
              multiline
              rows={3}
              variant='outlined'
            />
          </DialogContent>
          <DialogActions className='p-4 border-t gap-2'>
            <Button onClick={() => setSelectedOrder(null)} className='text-slate-500 font-bold'>
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={submittingManual}
              style={{ backgroundColor: '#006241' }}
              className='font-bold text-white'
            >
              {submittingManual ? 'Saving...' : 'Confirm Paid'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  )
}
