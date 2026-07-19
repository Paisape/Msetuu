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

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load dashboard.')
        setSummary(data)
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-1'>
        Mandir Setu — Dashboard
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-6'>
        Overview across all modules. Use the Orders menu for day-to-day order management.
      </Typography>

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
                  <Typography variant='h4' className='font-bold' style={{ color: '#059669' }}>
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
                      <i className={MODULE_ICONS[m.key]} style={{ fontSize: 22, color: '#059669' }} />
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
    </div>
  )
}

export default DashboardClient
