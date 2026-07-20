'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

type Invoice = {
  id: string
  invoiceNumber: string
  orderType: string
  orderId: string
  customerName: string
  customerEmail: string | null
  itemLabel: string
  subtotal: number
  gstPercentage: number
  gstAmount: number
  total: number
  status: string
  issuedAt: string
  cancelledAt: string | null
  refund?: { id: string; amount: number; status: string; reason: string | null } | null
}

const MODULE_LINK: Record<string, string> = {
  CHADHAVA: 'chadhava',
  EPUJA: 'epuja',
  KUNDLI: 'kundli',
  ECOMMERCE: 'ecommerce'
}

const InvoicePreviewClient = ({ id }: { id: string }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load invoice.')
        setInvoice(data)
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load invoice.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className='p-12 text-center'>
        <CircularProgress size={24} />
      </div>
    )
  }

  if (errorMsg || !invoice) {
    return (
      <div className='p-6'>
        <Alert severity='error'>{errorMsg || 'Invoice not found.'}</Alert>
      </div>
    )
  }

  const orderHref = MODULE_LINK[invoice.orderType]
    ? `/apps/mandir-setu/orders/${MODULE_LINK[invoice.orderType]}/${invoice.orderId}`
    : null

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-4 flex-wrap gap-3 print:hidden'>
        <Button component={Link} href='/apps/mandir-setu/accounts/invoices' startIcon={<i className='tabler-arrow-left' />}>
          Back to Invoices
        </Button>
        <div className='flex gap-2'>
          {orderHref && (
            <Button component={Link} href={orderHref} variant='outlined' size='small'>
              View Order
            </Button>
          )}
          <Button onClick={() => window.print()} variant='contained' size='small' startIcon={<i className='tabler-printer' />}>
            Print
          </Button>
        </div>
      </div>

      <Card className='max-w-3xl mx-auto'>
        <CardContent className='p-8'>
          <div className='flex justify-between items-start mb-8 flex-wrap gap-4'>
            <div>
              <Typography variant='h4' className='font-bold' style={{ color: '#006241' }}>
                Mandir Setu
              </Typography>
              <Typography variant='body2' className='text-textSecondary'>
                GST Invoice
              </Typography>
            </div>
            <div className='text-right'>
              <Typography variant='h6' className='font-bold'>
                {invoice.invoiceNumber}
              </Typography>
              <Typography variant='body2' className='text-textSecondary'>
                Issued: {new Date(invoice.issuedAt).toLocaleDateString('en-IN')}
              </Typography>
              <Chip
                size='small'
                label={invoice.status}
                color={invoice.status === 'PAID' ? 'success' : 'error'}
                className='mt-2'
              />
            </div>
          </div>

          <Divider className='mb-6' />

          <Grid container spacing={4} className='mb-6'>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant='caption' className='text-textSecondary block'>
                Billed To
              </Typography>
              <Typography className='font-medium'>{invoice.customerName}</Typography>
              <Typography variant='body2' className='text-textSecondary'>
                {invoice.customerEmail}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} className='sm:text-right'>
              <Typography variant='caption' className='text-textSecondary block'>
                Order Type
              </Typography>
              <Typography className='font-medium'>{invoice.orderType}</Typography>
            </Grid>
          </Grid>

          <Table className='mb-6'>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align='right'>Taxable Value</TableCell>
                <TableCell align='right'>GST ({invoice.gstPercentage}%)</TableCell>
                <TableCell align='right'>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{invoice.itemLabel}</TableCell>
                <TableCell align='right'>₹{invoice.subtotal}</TableCell>
                <TableCell align='right'>₹{invoice.gstAmount}</TableCell>
                <TableCell align='right'>₹{invoice.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className='flex justify-end mb-6'>
            <div className='w-full sm:w-64'>
              <div className='flex justify-between mb-1'>
                <Typography variant='body2'>Taxable Value</Typography>
                <Typography variant='body2'>₹{invoice.subtotal}</Typography>
              </div>
              <div className='flex justify-between mb-1'>
                <Typography variant='body2'>GST ({invoice.gstPercentage}%)</Typography>
                <Typography variant='body2'>₹{invoice.gstAmount}</Typography>
              </div>
              <Divider className='my-2' />
              <div className='flex justify-between'>
                <Typography className='font-bold'>Total Paid</Typography>
                <Typography className='font-bold'>₹{invoice.total}</Typography>
              </div>
            </div>
          </div>

          {invoice.status === 'CANCELLED' && (
            <Alert severity='error' className='mb-4'>
              This invoice was cancelled{invoice.cancelledAt ? ` on ${new Date(invoice.cancelledAt).toLocaleDateString('en-IN')}` : ''} because the
              underlying order was cancelled after payment.
            </Alert>
          )}

          {invoice.refund && (
            <Alert severity={invoice.refund.status === 'PROCESSED' ? 'success' : 'warning'}>
              Refund of ₹{invoice.refund.amount} — status: {invoice.refund.status}
              {invoice.refund.reason ? ` (${invoice.refund.reason})` : ''}
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InvoicePreviewClient
