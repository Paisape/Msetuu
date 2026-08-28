'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

type ModuleStat = { key: string; label: string; total: number; pending: number; href: string }

const MODULE_ICONS: Record<string, string> = {
  chadhava: 'tabler-flame',
  epuja: 'tabler-flower',
  jyotish: 'tabler-moon-stars',
  kundli: 'tabler-notebook',
  ecommerce: 'tabler-shopping-cart',
  yatra: 'tabler-map-2'
}

const DashboardClient = () => {
  const [summary, setSummary] = useState<{ modules: ModuleStat[]; customers: number; totalRevenue: number; refundsPending: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Purge Test Orders State
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false)
  const [purging, setPurging] = useState(false)
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string | null>(null)

  const loadSummary = () => {
    fetch('/api/dashboard/summary')
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load dashboard.')
        setSummary(data)
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const handleExecutePurge = async () => {
    setPurging(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/clear-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationPassword: 'GO_LIVE_PURGE_2026' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to purge orders.')

      setPurgeSuccessMsg('🎉 All test orders, test invoices, and audit logs have been successfully purged! Live revenue reset to ₹0.')
      setPurgeDialogOpen(false)
      loadSummary()
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while purging test orders.')
    } finally {
      setPurging(false)
    }
  }

  return (
    <div className='p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <div>
          <Typography variant='h4' className='font-bold mb-1'>
            Mandirsetuu — Dashboard
          </Typography>
          <Typography variant='body2' className='text-textSecondary'>
            Overview across all modules. Use the Orders menu for day-to-day order management.
          </Typography>
        </div>

        <Button
          variant='outlined'
          color='error'
          size='small'
          onClick={() => setPurgeDialogOpen(true)}
          startIcon={<i className='tabler-trash-x' />}
          className='font-bold text-xs'
        >
          Clear Test Orders for Go Live
        </Button>
      </div>

      {purgeSuccessMsg && (
        <Alert severity='success' className='mb-4' onClose={() => setPurgeSuccessMsg(null)}>
          {purgeSuccessMsg}
        </Alert>
      )}

      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

      {loading ? (
        <div className='p-12 text-center'>
          <CircularProgress size={24} />
        </div>
      ) : summary ? (
        <>
          <Grid container spacing={4} className='mb-6'>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant='caption' className='text-textSecondary'>
                    Total Revenue (Paid Invoices)
                  </Typography>
                  <Typography variant='h4' className='font-bold' style={{ color: '#006241' }}>
                    ₹{summary.totalRevenue}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant='caption' className='text-textSecondary'>
                    Registered Customers
                  </Typography>
                  <Typography variant='h4' className='font-bold'>
                    {summary.customers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent className='flex items-center justify-between'>
                  <div>
                    <Typography variant='caption' className='text-textSecondary'>
                      Refunds Awaiting Action
                    </Typography>
                    <Typography variant='h4' className='font-bold' color={summary.refundsPending > 0 ? 'error' : undefined}>
                      {summary.refundsPending}
                    </Typography>
                  </div>
                  {summary.refundsPending > 0 && (
                    <Link href='/apps/mandir-setu/accounts/refunds'>
                      <Chip label='Review' color='error' size='small' clickable />
                    </Link>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant='h5' className='font-bold mb-4'>
            Orders by Module
          </Typography>
          <Grid container spacing={4}>
            {summary.modules.map(m => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.key}>
                <Card component={Link} href={m.href} className='block hover:shadow-lg transition-shadow'>
                  <CardContent className='flex items-center gap-4'>
                    <div
                      className='flex items-center justify-center rounded-full'
                      style={{ width: 48, height: 48, background: 'rgba(5,150,105,0.1)' }}
                    >
                      <i className={MODULE_ICONS[m.key]} style={{ fontSize: 22, color: '#006241' }} />
                    </div>
                    <div>
                      <Typography className='font-bold'>{m.label}</Typography>
                      <Typography variant='body2' className='text-textSecondary'>
                        {m.total} total{m.pending > 0 ? ` · ${m.pending} pending` : ''}
                      </Typography>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : null}

      {/* Confirmation Dialog for Purging Test Orders */}
      <Dialog
        open={purgeDialogOpen}
        onClose={() => !purging && setPurgeDialogOpen(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle className='font-bold text-lg text-slate-800 flex items-center gap-2'>
          <i className='tabler-alert-triangle text-amber-500 text-xl' />
          Clear All Test Orders for Go Live?
        </DialogTitle>
        <DialogContent dividers className='space-y-3 text-sm text-slate-600'>
          <Typography variant='body2'>
            This action will permanently delete all <strong>test orders</strong>, <strong>test customer accounts</strong>, <strong>test invoices</strong>, and <strong>test audit trails</strong> created during development so your live sales counter starts fresh at ₹0.
          </Typography>
          <Alert severity='info' className='text-xs'>
            🛡️ <strong>100% Safe:</strong> Your Offers, Puja listings, Chadhava listings, Products, SMS Templates, Astrologers, and Admin accounts will <strong>NOT</strong> be deleted.
          </Alert>
        </DialogContent>
        <DialogActions className='px-6 pb-4 justify-between'>
          <Button
            onClick={() => setPurgeDialogOpen(false)}
            disabled={purging}
            className='text-slate-600 font-bold text-xs'
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleExecutePurge}
            disabled={purging}
            startIcon={purging ? <CircularProgress size={14} color='inherit' /> : <i className='tabler-trash' />}
            className='font-bold text-xs'
          >
            {purging ? 'Purging Test Orders...' : 'Purge All Test Orders Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default DashboardClient
