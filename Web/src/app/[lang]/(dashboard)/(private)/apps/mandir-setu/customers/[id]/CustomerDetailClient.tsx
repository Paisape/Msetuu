'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  CONFIRMED: 'info',
  SHARED_WITH_PANDIT: 'info',
  DISPATCHED: 'info',
  SHIPPED: 'info',
  COMPLETED: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error',
  FAILED: 'error',
  PAID: 'success'
}

const MODULE_LABEL: Record<string, string> = {
  chadhava: 'Chadhava',
  epuja: 'E-Puja',
  jyotish: 'Jyotish',
  kundli: 'Kundli',
  ecommerce: 'Ecommerce',
  yatra: 'Yatra'
}

const CustomerDetailClient = ({ id }: { id: string }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [signupOverride, setSignupOverride] = useState<string>('')
  const [firstOverride, setFirstOverride] = useState<string>('')
  const [recurringOverride, setRecurringOverride] = useState<string>('')
  const [overrideSaving, setOverrideSaving] = useState(false)
  const [overrideSuccess, setOverrideSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(res => res.json().then(d => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d?.error || 'Failed to load customer.')
        setData(d)
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load customer.'))
      .finally(() => setLoading(false))

    fetch(`/api/admin/referrals/user-overrides/${id}`)
      .then(res => res.json())
      .then(d => {
        if (d.success && d.user) {
          setSignupOverride(d.user.refCommissionSignup !== null && d.user.refCommissionSignup !== undefined ? String(d.user.refCommissionSignup) : '')
          setFirstOverride(d.user.refCommissionFirst !== null && d.user.refCommissionFirst !== undefined ? String(d.user.refCommissionFirst) : '')
          setRecurringOverride(d.user.refCommissionRecurring !== null && d.user.refCommissionRecurring !== undefined ? String(d.user.refCommissionRecurring) : '')
        }
      })
      .catch(err => console.error(err))
  }, [id])

  const handleSaveOverrides = async () => {
    setOverrideSaving(true)
    setOverrideSuccess(false)
    try {
      const res = await fetch(`/api/admin/referrals/user-overrides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refCommissionSignup: signupOverride === '' ? null : Number(signupOverride),
          refCommissionFirst: firstOverride === '' ? null : Number(firstOverride),
          refCommissionRecurring: recurringOverride === '' ? null : Number(recurringOverride)
        })
      })
      if (!res.ok) throw new Error('Failed to save overrides')
      setOverrideSuccess(true)
      setTimeout(() => setOverrideSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setOverrideSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-12 text-center'>
        <CircularProgress size={24} />
      </div>
    )
  }

  if (errorMsg || !data) {
    return (
      <div className='p-6'>
        <Alert severity='error'>{errorMsg || 'Customer not found.'}</Alert>
      </div>
    )
  }

  const { user, orders, totalSpend, orderCount } = data

  return (
    <div className='p-6'>
      <Button component={Link} href='/apps/mandir-setu/customers' startIcon={<i className='tabler-arrow-left' />} className='mb-4'>
        Back to Customers
      </Button>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent className='flex flex-col items-center text-center gap-3 py-8'>
              <Avatar src={user.image || undefined} sx={{ width: 72, height: 72 }}>
                {(user.name || user.email || '?')[0].toUpperCase()}
              </Avatar>
              <Typography variant='h5' className='font-bold'>
                {user.name || 'Unnamed'}
              </Typography>
              <Typography className='text-textSecondary'>{user.email}</Typography>
              {user.phone && <Typography className='text-textSecondary'>{user.phone}</Typography>}
              <Typography variant='caption' className='text-textSecondary'>
                Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}
              </Typography>

              <div className='flex gap-6 mt-4'>
                <div>
                  <Typography variant='h6' className='font-bold'>
                    {orderCount}
                  </Typography>
                  <Typography variant='caption' className='text-textSecondary'>
                    Orders
                  </Typography>
                </div>
                <div>
                  <Typography variant='h6' className='font-bold'>
                    ₹{totalSpend}
                  </Typography>
                  <Typography variant='caption' className='text-textSecondary'>
                    Lifetime Spend
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='mt-6'>
            <CardHeader title='Referral Commission Overrides' subheader='Set user-specific custom rates. Leave blank to inherit global defaults.' />
            <CardContent className='flex flex-col gap-4'>
              {overrideSuccess && <Alert severity='success'>Overrides saved successfully.</Alert>}
              <TextField
                label='Signup Reward Override (₹)'
                type='number'
                size='small'
                value={signupOverride}
                onChange={e => setSignupOverride(e.target.value)}
                fullWidth
                placeholder='Inherit global default'
              />
              <TextField
                label='First Order Override (Amount or %)'
                type='number'
                size='small'
                value={firstOverride}
                onChange={e => setFirstOverride(e.target.value)}
                fullWidth
                placeholder='Inherit global default'
              />
              <TextField
                label='Ongoing Orders Override (Amount or %)'
                type='number'
                size='small'
                value={recurringOverride}
                onChange={e => setRecurringOverride(e.target.value)}
                fullWidth
                placeholder='Inherit global default'
              />
              <Button
                variant='contained'
                onClick={handleSaveOverrides}
                disabled={overrideSaving}
                fullWidth
              >
                {overrideSaving ? <CircularProgress size={24} color='inherit' /> : 'Save Overrides'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader title='All Orders' subheader='Every order this customer has placed, across every module' />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align='right'>View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        No orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o: any) => (
                      <TableRow key={`${o.type}-${o.id}`} hover>
                        <TableCell>{MODULE_LABEL[o.type]}</TableCell>
                        <TableCell>{o.label}</TableCell>
                        <TableCell>{o.amount || o.amount === 0 ? `₹${o.amount}` : '—'}</TableCell>
                        <TableCell>
                          <Chip size='small' label={o.status.replace(/_/g, ' ')} color={STATUS_COLORS[o.status] || 'default'} />
                        </TableCell>
                        <TableCell>{new Date(o.createdAt).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell align='right'>
                          <Button size='small' component={Link} href={`/apps/mandir-setu/orders/${o.type}/${o.id}`}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default CustomerDetailClient
