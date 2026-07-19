'use client'

import { useState, useEffect } from 'react'

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
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

type Invoice = {
  id: string
  invoiceNumber: string
  orderType: string
  customerName: string
  customerEmail: string | null
  itemLabel: string
  total: number
  status: string
  issuedAt: string
  refund?: { status: string } | null
}

const InvoiceTable = ({ title, status }: { title: string; status?: string }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const url = status ? `/api/invoices?status=${status}` : '/api/invoices'

    fetch(url)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load invoices.')
        setInvoices(Array.isArray(data) ? data : [])
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load invoices.'))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-4'>
        {title}
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
                  <TableCell>Item</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Issued</TableCell>
                  <TableCell align='right'>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map(inv => (
                    <TableRow key={inv.id} hover>
                      <TableCell className='font-medium'>{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <Typography className='font-medium'>{inv.customerName}</Typography>
                        <Typography variant='caption' className='text-textSecondary'>
                          {inv.customerEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>{inv.itemLabel}</TableCell>
                      <TableCell>{inv.orderType}</TableCell>
                      <TableCell>₹{inv.total}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={inv.status}
                          color={inv.status === 'PAID' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{new Date(inv.issuedAt).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' component={Link} href={`/apps/mandir-setu/accounts/invoices/${inv.id}`} aria-label='View invoice'>
                          <i className='tabler-eye' />
                        </IconButton>
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

export default InvoiceTable
