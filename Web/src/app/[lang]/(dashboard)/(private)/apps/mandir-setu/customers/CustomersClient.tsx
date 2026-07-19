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
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'

type Customer = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  image: string | null
  createdAt: string
  orderCount: number
  totalSpend: number
}

const CustomersClient = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load customers.')
        setCustomers(Array.isArray(data) ? data : [])
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load customers.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => {
    const q = search.trim().toLowerCase()

    if (!q) return true

    return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-4'>
        Customers
      </Typography>

      {errorMsg && <Alert severity='error' className='mb-4'>{errorMsg}</Alert>}

      <Card>
        <div className='p-4'>
          <TextField
            size='small'
            placeholder='Search by name or email...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 280 }}
          />
        </div>

        {loading ? (
          <div className='p-12 text-center'>
            <CircularProgress size={24} />
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Lifetime Spend</TableCell>
                  <TableCell align='right'>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar src={c.image || undefined}>{(c.name || c.email || '?')[0].toUpperCase()}</Avatar>
                          <div>
                            <Typography className='font-medium'>{c.name || 'Unnamed'}</Typography>
                            <Typography variant='caption' className='text-textSecondary'>
                              {c.email}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{c.phone || '—'}</TableCell>
                      <TableCell>{new Date(c.createdAt).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{c.orderCount}</TableCell>
                      <TableCell>₹{c.totalSpend}</TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' component={Link} href={`/apps/mandir-setu/customers/${c.id}`} aria-label='View customer'>
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

export default CustomersClient
