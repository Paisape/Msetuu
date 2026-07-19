'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'

export type OrderColumn = {
  key: string
  label: string
  render?: (item: Record<string, any>) => React.ReactNode
}

type OrderTableProps = {
  title: string

  // GET endpoint returning this module's orders — ?all=1 is appended automatically.
  listUrl: string
  patchUrl: (id: string) => string
  detailHref: (item: Record<string, any>) => string
  statusOptions: string[]
  columns: OrderColumn[]
  searchPlaceholder?: string

  // Which fields to match the free-text search box against (dot paths supported, e.g. 'chadhavaListing.title').
  searchFields?: string[]
}

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

const getPath = (obj: Record<string, any>, path: string) =>
  path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)

const OrderTable = ({ title, listUrl, patchUrl, detailHref, statusOptions, columns, searchPlaceholder, searchFields }: OrderTableProps) => {
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const sep = listUrl.includes('?') ? '&' : '?'
      const res = await fetch(`${listUrl}${sep}all=1`)
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || `Failed to load ${title}.`)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : `Failed to load ${title}.`)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    setErrorMsg(null)

    try {
      const res = await fetch(patchUrl(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to update status.')
      await fetchItems()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = useMemo(() => {
    let result = items

    if (statusFilter !== 'All') {
      result = result.filter(item => item.status === statusFilter)
    }

    if (search.trim() && searchFields?.length) {
      const q = search.trim().toLowerCase()

      result = result.filter(item =>
        searchFields.some(field => String(getPath(item, field) ?? '').toLowerCase().includes(q))
      )
    }

    return result
  }, [items, statusFilter, search, searchFields])

  return (
    <div>
      <div className='flex justify-between items-center mb-4 flex-wrap gap-3'>
        <Typography variant='h4' className='font-bold'>
          {title}
        </Typography>
      </div>

      {errorMsg && (
        <Alert severity='error' className='mb-4' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Card>
        <div className='flex items-center gap-3 p-4 flex-wrap'>
          <TextField
            size='small'
            placeholder={searchPlaceholder || 'Search...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search text-lg' />
                </InputAdornment>
              )
            }}
          />
          <Select size='small' value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value='All'>All statuses</MenuItem>
            {statusOptions.map(s => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>
          <Typography variant='body2' className='text-textSecondary'>
            {filtered.length} order{filtered.length === 1 ? '' : 's'}
          </Typography>
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
                  {columns.map(col => (
                    <TableCell key={col.key}>{col.label}</TableCell>
                  ))}
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 2} align='center'>
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(item => (
                    <TableRow key={item.id} hover>
                      {columns.map(col => (
                        <TableCell key={col.key}>
                          {col.render ? col.render(item) : String(getPath(item, col.key) ?? '')}
                        </TableCell>
                      ))}
                      <TableCell>
                        {updatingId === item.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <Select
                            size='small'
                            value={item.status}
                            onChange={e => handleStatusChange(item.id, e.target.value)}
                            sx={{ minWidth: 150 }}
                            renderValue={value => (
                              <Chip size='small' label={String(value).replace(/_/g, ' ')} color={STATUS_COLORS[value as string] || 'default'} />
                            )}
                          >
                            {statusOptions.map(s => (
                              <MenuItem key={s} value={s}>
                                {s.replace(/_/g, ' ')}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' component={Link} href={detailHref(item)} aria-label='View order'>
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

export default OrderTable
