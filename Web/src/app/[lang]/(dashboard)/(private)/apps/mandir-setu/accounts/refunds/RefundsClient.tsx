'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

type Refund = {
  id: string
  amount: number
  reason: string | null
  status: string
  createdAt: string
  processedAt: string | null
  invoice: {
    id: string
    invoiceNumber: string
    customerName: string
    orderType: string
  }
}

const RefundsClient = () => {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/refunds')
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to load refunds.')
      setRefunds(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load refunds.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markProcessed = async (id: string) => {
    setUpdatingId(id)

    try {
      const res = await fetch(`/api/refunds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSED' })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to update refund.')
      await load()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update refund.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-2'>
        Refund List
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-4'>
        Created automatically when a paid order is cancelled. No payment gateway is integrated yet, so refunds are tracked here for finance to
        process manually and mark complete.
      </Typography>

      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

      <Card>
        {loading ? (
          <div className='p-12 text-center'>
            <CircularProgress size={24} />
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align='right'>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      No refunds recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  refunds.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Link href={`/apps/mandir-setu/accounts/invoices/${r.invoice.id}`} className='font-medium'>
                          {r.invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{r.invoice.customerName}</TableCell>
                      <TableCell>{r.invoice.orderType}</TableCell>
                      <TableCell>₹{r.amount}</TableCell>
                      <TableCell>{r.reason || '—'}</TableCell>
                      <TableCell>
                        <Chip size='small' label={r.status} color={r.status === 'PROCESSED' ? 'success' : 'warning'} />
                      </TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell align='right'>
                        {r.status === 'INITIATED' ? (
                          <Button size='small' variant='outlined' disabled={updatingId === r.id} onClick={() => markProcessed(r.id)}>
                            {updatingId === r.id ? <CircularProgress size={16} /> : 'Mark Processed'}
                          </Button>
                        ) : (
                          <Typography variant='caption' className='text-textSecondary'>
                            {r.processedAt ? new Date(r.processedAt).toLocaleDateString('en-IN') : '—'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  )
}

export default RefundsClient
