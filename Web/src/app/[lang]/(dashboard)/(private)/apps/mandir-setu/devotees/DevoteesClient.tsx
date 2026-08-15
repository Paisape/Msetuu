'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

type Devotee = {
  id: string
  sNo: number
  name: string
  nameLocal: string | null
  mobile: string
  gotra: string
  dob: string
  email: string
  referredBy: string
  orderId: string
}

export default function DevoteesClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [devotees, setDevotees] = useState<Devotee[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetch('/api/devotees')
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load devotees.')
        setDevotees(Array.isArray(data) ? data : [])
      })
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : 'Failed to load devotees.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(0)
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Filter devotees list in browser
  const filtered = devotees.filter((d) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.nameLocal && d.nameLocal.toLowerCase().includes(q)) ||
      (d.mobile && d.mobile.includes(q)) ||
      (d.gotra && d.gotra.toLowerCase().includes(q)) ||
      (d.referredBy && d.referredBy.toLowerCase().includes(q))
    )
  })

  // Sliced list for pagination
  const sliced = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <div className='p-6 space-y-6 max-w-6xl mx-auto'>
      <div>
        <Typography variant='h4' className='font-bold text-slate-800 mb-1 flex items-center gap-2'>
          👥 Devotee Directory
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          Browse individual devotees booking details, gotra info, and tracking references.
        </Typography>
      </div>

      {errorMsg && <Alert severity='error'>{errorMsg}</Alert>}

      <Card className='border border-slate-100 shadow-sm'>
        <div className='p-5 bg-slate-50/50 border-b border-slate-100'>
          <TextField
            size='small'
            placeholder='Search devotee name, gotra, mobile...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='bg-white'
            sx={{ minWidth: 300 }}
          />
        </div>

        {loading ? (
          <div className='p-12 text-center'>
            <CircularProgress size={28} style={{ color: '#FF671F' }} />
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHead className='bg-slate-50'>
                <TableRow>
                  <TableCell className='font-bold' style={{ width: 80 }}>S.No</TableCell>
                  <TableCell className='font-bold'>Name</TableCell>
                  <TableCell className='font-bold'>Mobile No</TableCell>
                  <TableCell className='font-bold'>Gotra</TableCell>
                  <TableCell className='font-bold'>Date of Birth</TableCell>
                  <TableCell className='font-bold'>WhatsApp No</TableCell>
                  <TableCell className='font-bold'>Referred By</TableCell>
                  <TableCell className='font-bold text-right' style={{ width: 100 }}>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sliced.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center' className='py-8 text-slate-400'>
                      No devotee profiles matching query.
                    </TableCell>
                  </TableRow>
                ) : (
                  sliced.map((d, index) => (
                    <TableRow key={d.id} hover className='hover:bg-slate-50/30'>
                      <TableCell className='font-bold text-slate-400'>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell className='font-semibold text-slate-700'>
                        {d.name}
                        {d.nameLocal ? (
                          <span className='block text-xs font-normal text-slate-400'>({d.nameLocal})</span>
                        ) : null}
                      </TableCell>
                      <TableCell className='font-semibold text-slate-700'>{d.mobile}</TableCell>
                      <TableCell className='text-slate-600'>{d.gotra}</TableCell>
                      <TableCell className='text-slate-600'>{d.dob}</TableCell>
                      <TableCell className='text-slate-600'>{d.email}</TableCell>
                      <TableCell>
                        {d.referredBy !== '—' ? (
                          <Chip label={d.referredBy} size='small' className='bg-blue-50 text-blue-700 border-blue-100 border' />
                        ) : (
                          <span className='text-slate-300'>—</span>
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton
                          size='small'
                          component={Link}
                          href={`/${locale}/apps/mandir-setu/devotees/${d.id}`}
                          style={{ color: '#FF671F' }}
                          aria-label='View Devotee Profile'
                        >
                          <i className='tabler-eye text-lg' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component='div'
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </div>
  )
}
