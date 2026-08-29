'use client'

import { useState, useEffect } from 'react'
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
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'

type Campaign = {
  id: string
  title: string
  slug: string
  offerPrice: string
}

type OrderDevotee = {
  name: string
  nameLocal: string | null
  gotra: string
  dob: string
  phone: string
  email: string | null
}

type Order = {
  id: string
  amount: string
  paymentId: string
  referralCode: string | null
  reconciledStatus: string
  createdAt: string
  ipAddress: string | null
  ipLocation: string | null
  gpsLocation: string | null
  devotees: OrderDevotee[]
}

type ReferralStat = {
  code: string
  partnerName: string
  count: number
  totalRevenue: number
  commission: number
}

type ReportStats = {
  viewsCount: number
  bookingsCount: number
  conversionRate: number
  totalRevenue: number
}

export default function ReportsClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [referrals, setReferrals] = useState<ReferralStat[]>([])

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Order Details Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadReports = async (campaignId?: string) => {
    if (campaignId) setFiltering(true)
    try {
      const url = campaignId ? `/api/offers/reports?offerLinkId=${campaignId}` : '/api/offers/reports'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load reports.')
      const data = await res.json()

      setCampaigns(data.campaigns)
      setSelectedCampaignId(data.selectedId)
      setStats(data.stats)
      setOrders(data.orders)
      setReferrals(data.referrals)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
      setFiltering(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    loadReports(campaignId)
  }

  // Order Row Construction (1 row per Order transaction)
  const orderRows: any[] = orders.map((order, index) => {
    const devotees = order.devotees || []
    const primaryDevotee = devotees.find(d => d.isPrimary) || devotees[0]
    const otherDevotees = devotees.filter(d => d !== primaryDevotee).map(d => d.name).filter(Boolean)
    const devoteesSummary = primaryDevotee?.name 
      ? `${primaryDevotee.name} (Main Devotee)${otherDevotees.length > 0 ? ' — ' + otherDevotees.join(', ') : ''}`
      : devotees.map(d => d.name).filter(Boolean).join(', ')

    return {
      id: order.id,
      sNo: index + 1,
      date: new Date(order.createdAt).toLocaleDateString('en-IN'),
      rawDate: new Date(order.createdAt),
      primaryName: primaryDevotee?.name || 'Devotee',
      primaryNameLocal: primaryDevotee?.nameLocal || null,
      devoteeCount: devotees.length || 1,
      devoteesSummary: devoteesSummary || primaryDevotee?.name || 'Devotee',
      devotees: devotees,
      mobile: primaryDevotee?.phone || devotees[0]?.phone || '—',
      gotra: primaryDevotee?.gotra || '—',
      dob: primaryDevotee?.dob || '—',
      referredBy: order.referralCode || '—',
      amountPaid: Number(order.amount),
      paymentId: order.paymentId || '—',
      reconciledStatus: order.reconciledStatus || 'RECONCILED_AUTO',
      parentOrder: order
    }
  })

  // Order Filtering (Search by Name, Mobile, Gotra, Referral Code, or Dates)
  const filteredOrders = orderRows.filter(row => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = !q || 
      (row.primaryName && row.primaryName.toLowerCase().includes(q)) || 
      (row.devoteesSummary && row.devoteesSummary.toLowerCase().includes(q)) || 
      (row.mobile && row.mobile.includes(q)) || 
      (row.gotra && row.gotra.toLowerCase().includes(q)) || 
      (row.referredBy && row.referredBy.toLowerCase().includes(q))

    let matchesDate = true
    if (startDate) {
      matchesDate = matchesDate && row.rawDate >= new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      matchesDate = matchesDate && row.rawDate <= end
    }

    return matchesSearch && matchesDate
  })

  // Pagination slicing
  const slicedRows = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // CSV Export (Exporting Orders with complete Devotee, Campaign, and Geolocation fields)
  const handleExportCSV = () => {
    const headers = [
      'S.No',
      'Order ID',
      'Date & Time',
      'Primary Devotee Name',
      'Primary Mobile No',
      'Primary Email',
      'Primary Gotra',
      'Primary DOB',
      'Primary Pincode',
      'Primary Locality',
      'Primary City',
      'Primary State',
      'All Booked Devotees',
      'Total Devotees Count',
      'Referred By Partner',
      'Amount Paid (INR)',
      'Payment Gateway ID',
      'Reconciled Status',
      'User IP Address',
      'IP Location',
      'GPS Coordinates'
    ]
    const rows = filteredOrders.map(row => {
      const parent = row.parentOrder || {}
      const primary = parent.devotees?.find((d: any) => d.isPrimary) || parent.devotees?.[0] || {}
      return [
        row.sNo,
        row.id,
        new Date(parent.createdAt || row.rawDate).toLocaleString(),
        row.primaryName || '',
        row.mobile || '',
        primary.email || '',
        row.gotra || '',
        row.dob || '',
        primary.pincode || '',
        primary.locality || '',
        primary.city || '',
        primary.state || '',
        row.devoteesSummary || '',
        row.devoteeCount,
        row.referredBy,
        row.amountPaid,
        row.paymentId,
        row.reconciledStatus,
        parent.userIp || '—',
        parent.ipLocation || '—',
        parent.latitude && parent.longitude ? `${parent.latitude}, ${parent.longitude}` : '—'
      ]
    })

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Campaign_Orders_${selectedCampaignId || 'All'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
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
      {/* Selector Header */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Box className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <Typography variant='h4' className='font-bold text-slate-800 mb-2'>
              📈 Campaign Analytics Reports
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              Inspect dynamic tracking data, page conversions, order details, and partner referral commissions.
            </Typography>
          </div>

          {campaigns.length > 0 && (
            <div className='flex items-center gap-3 w-full sm:w-auto'>
              <span className='text-xs font-bold text-slate-500 whitespace-nowrap'>Select Campaign:</span>
              <Select
                value={selectedCampaignId}
                onChange={(e) => handleCampaignChange(e.target.value)}
                size='small'
                disabled={filtering}
                className='bg-white text-sm w-full sm:min-w-[250px]'
              >
                {campaigns.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                ))}
              </Select>
            </div>
          )}
        </Box>
      </Card>

      {errorMsg && <Alert severity='error'>{errorMsg}</Alert>}

      {/* KPI Stats Grid */}
      {stats && (
        <div className='grid grid-cols-1 sm:grid-cols-5 gap-4'>
          <Card className='p-4 border border-slate-100 shadow-sm text-center'>
            <Typography variant='caption' className='text-slate-400 font-bold tracking-wider mb-1 block'>PAGE VIEWS</Typography>
            <Typography variant='h4' className='font-black text-slate-700'>{stats.viewsCount}</Typography>
          </Card>

          <Card className='p-4 border border-slate-100 shadow-sm text-center'>
            <Typography variant='caption' className='text-slate-400 font-bold tracking-wider mb-1 block'>TOTAL ORDERS</Typography>
            <Typography variant='h4' className='font-black text-slate-800'>{stats.bookingsCount}</Typography>
          </Card>

          <Card className='p-4 border border-emerald-200 bg-emerald-50/40 shadow-sm text-center'>
            <Typography variant='caption' className='text-emerald-700 font-bold tracking-wider mb-1 block'>DEVOTEES BOOKED</Typography>
            <Typography variant='h4' className='font-black text-emerald-700'>{stats.totalDevoteesCount || stats.bookingsCount}</Typography>
          </Card>

          <Card className='p-4 border border-slate-100 shadow-sm text-center'>
            <Typography variant='caption' className='text-slate-400 font-bold tracking-wider mb-1 block'>CONVERSION RATE</Typography>
            <Typography variant='h4' className='font-black text-blue-700'>{stats.conversionRate}%</Typography>
          </Card>

          <Card className='p-4 border border-slate-100 shadow-sm text-center'>
            <Typography variant='caption' className='text-slate-400 font-bold tracking-wider mb-1 block'>TOTAL REVENUE</Typography>
            <Typography variant='h4' className='font-black text-slate-900'>₹{stats.totalRevenue.toFixed(2)}</Typography>
          </Card>
        </div>
      )}

      {/* Referral Commission Statistics */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Typography variant='h5' className='font-bold text-slate-800 mb-2'>
          👥 Partner Referral Commissions
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          Track earnings, order counts, and commission payouts generated by your active partner referral codes.
        </Typography>

        <TableContainer className='border rounded-lg overflow-hidden'>
          <Table>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold'>Partner Code</TableCell>
                <TableCell className='font-bold'>Partner Name</TableCell>
                <TableCell className='font-bold text-center'>Bookings Count</TableCell>
                <TableCell className='font-bold'>Commission Accrued (₹)</TableCell>
                <TableCell className='font-bold text-right'>Revenue Generated (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center py-8 text-slate-400'>
                    No referral orders tracked for this campaign yet.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((partner) => (
                  <TableRow key={partner.code} className='hover:bg-slate-50/50'>
                    <TableCell className='font-bold text-[#000080]'>{partner.code}</TableCell>
                    <TableCell className='font-semibold text-slate-700'>{partner.partnerName}</TableCell>
                    <TableCell className='text-center font-bold text-slate-600'>{partner.count}</TableCell>
                    <TableCell className='font-bold text-emerald-700 bg-emerald-50/30'>₹{partner.commission.toFixed(2)}</TableCell>
                    <TableCell className='text-right font-bold text-slate-800'>₹{partner.totalRevenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Orders details */}
      <Card className='p-6 border border-slate-100 shadow-sm'>
        <Box className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
          <div>
            <Typography variant='h5' className='font-bold text-slate-800'>
              📋 Confirmed Booking Details
            </Typography>
            <Typography variant='body2' color='textSecondary'>
              Detailed list of individual devotees, gotras, contact information, and referral attributes.
            </Typography>
          </div>

          <Button
            variant='contained'
            onClick={handleExportCSV}
            startIcon={<i className='tabler-download' />}
            style={{ backgroundColor: '#FF671F' }}
            className="font-bold text-white"
          >
            Export CSV
          </Button>
        </Box>

        {/* Filters Box */}
        <Box className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100'>
          <TextField
            label='Search Name, Mobile, Gotra or Code'
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            size='small'
            className='bg-white'
            fullWidth
          />
          <TextField
            label='Start Date'
            type='date'
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            size='small'
            className='bg-white'
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label='End Date'
            type='date'
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            size='small'
            className='bg-white'
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>

        <TableContainer className='border rounded-lg overflow-x-auto overflow-y-auto max-h-[550px] shadow-sm'>
          <Table stickyHeader size='small'>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold' style={{ minWidth: 50 }}>S.No</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 130 }}>Order ID</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 90 }}>Date</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 160 }}>Main Devotee</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 220 }}>All Devotees</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 110 }}>Mobile No</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 90 }}>Gotra</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 95 }}>Referred By</TableCell>
                <TableCell className='font-bold' style={{ minWidth: 100 }}>Amount Paid</TableCell>
                <TableCell className='font-bold text-center' style={{ minWidth: 90 }}>Reconciled</TableCell>
                <TableCell className='font-bold text-right sticky right-0 bg-slate-100 z-20 shadow-[-4px_0_6px_rgba(0,0,0,0.06)]' style={{ minWidth: 85 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slicedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className='text-center py-8 text-slate-400'>
                    No matching booking orders found.
                  </TableCell>
                </TableRow>
              ) : (
                slicedRows.map((row) => (
                  <TableRow key={row.id} className='hover:bg-slate-50/50'>
                    <TableCell className='text-slate-500 font-bold'>{row.sNo}</TableCell>
                    <TableCell className='font-mono text-xs font-bold text-slate-700' title={row.id}>
                      {row.id.length > 12 ? `${row.id.slice(0, 8)}...` : row.id}
                    </TableCell>
                    <TableCell className='text-slate-500'>{row.date}</TableCell>
                    <TableCell className='font-bold text-slate-800 cursor-pointer' onClick={() => handleOpenOrderDetails(row.parentOrder)}>
                      <span className='hover:underline hover:text-[#FF671F]'>
                        {row.primaryName}
                      </span>
                      {row.primaryNameLocal && (
                        <span className='block text-xs font-normal text-slate-400'>({row.primaryNameLocal})</span>
                      )}
                    </TableCell>
                    <TableCell className='text-slate-600 text-xs font-medium'>
                      <div className='max-w-[240px] leading-relaxed'>
                        {row.devoteesSummary}
                        {row.devoteeCount > 1 && (
                          <Chip 
                            label={`${row.devoteeCount} Total`}
                            size='small'
                            className='ml-1.5 bg-orange-100 text-[#FF671F] font-bold h-4 text-[9px]'
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-slate-600 font-medium'>{row.mobile}</TableCell>
                    <TableCell className='text-slate-600'>{row.gotra}</TableCell>
                    <TableCell>
                      {row.referredBy !== '—' ? (
                        <Chip label={row.referredBy} size='small' className='bg-blue-50 text-blue-700 border-blue-100 border font-bold' />
                      ) : (
                        <span className='text-slate-300'>—</span>
                      )}
                    </TableCell>
                    <TableCell className='font-bold text-slate-800'>₹{Number(row.amountPaid).toFixed(2)}</TableCell>
                    <TableCell className='text-center'>
                      <Chip 
                        label={row.reconciledStatus.replace('RECONCILED_', '')} 
                        size='small'
                        color={row.reconciledStatus.startsWith('RECONCILED') ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell className='text-right sticky right-0 bg-white z-10 shadow-[-4px_0_6px_rgba(0,0,0,0.06)]'>
                      <Button 
                        size='small' 
                        variant='contained'
                        onClick={() => handleOpenOrderDetails(row.parentOrder)}
                        startIcon={<i className='tabler-eye text-sm' />}
                        style={{ backgroundColor: '#FF671F', color: '#ffffff' }}
                        className='font-bold text-xs px-2.5 py-1 min-w-0 shadow-sm'
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component='div'
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />

        <div className='flex justify-start mt-4'>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links`)}
            className='border-slate-300 text-slate-700 font-bold'
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>

      {/* View Order Details Popup Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          className: 'rounded-2xl p-4'
        }}
      >
        <DialogTitle className='font-bold text-xl text-slate-800 flex justify-between items-center'>
          <span>Booking Order Details</span>
          <IconButton size='small' onClick={() => setDetailOpen(false)}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className='space-y-4 text-sm'>
          {selectedOrder && (
            <>
              <div className='grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100'>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>ORDER ID</span>
                  <span className='font-mono font-bold text-slate-700' title={selectedOrder.id}>
                    #MS-{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>DATE</span>
                  <span className='font-bold text-slate-700'>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>AMOUNT PAID</span>
                  <span className='font-bold text-slate-800 text-base'>₹{Number(selectedOrder.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>GATEWAY TRANSACTION ID</span>
                  <span className='font-mono font-bold text-slate-700'>{selectedOrder.paymentId || '—'}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>REFERRAL APPLIED</span>
                  <span className='font-bold text-slate-700'>{selectedOrder.referralCode || 'None'}</span>
                </div>
                <div>
                  <span className='text-xs text-slate-400 font-bold block'>RECONCILIATION STATUS</span>
                  <Chip 
                    label={selectedOrder.reconciledStatus} 
                    size='small'
                    color={selectedOrder.reconciledStatus.startsWith('RECONCILED') ? 'success' : 'default'}
                  />
                </div>
                {selectedOrder.paymentMethod && (
                  <div>
                    <span className='text-xs text-slate-400 font-bold block'>PAYMENT METHOD</span>
                    <Chip label={selectedOrder.paymentMethod} size='small' color='primary' variant='outlined' className='font-bold' />
                  </div>
                )}
                {selectedOrder.reconciliationNotes && (
                  <div className='col-span-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100'>
                    <span className='text-xs text-emerald-800 font-bold block mb-0.5'>GATEWAY VERIFICATION LOG</span>
                    <span className='text-xs text-emerald-950 font-medium'>{selectedOrder.reconciliationNotes}</span>
                  </div>
                )}
                {selectedOrder.ipAddress && (
                  <div>
                    <span className='text-xs text-slate-400 font-bold block'>🌐 USER IP ADDRESS</span>
                    <span className='font-mono font-bold text-slate-700'>{selectedOrder.ipAddress}</span>
                  </div>
                )}
                {selectedOrder.ipLocation && (
                  <div>
                    <span className='text-xs text-slate-400 font-bold block'>📍 IP LOCATION</span>
                    <span className='font-bold text-slate-700'>{selectedOrder.ipLocation}</span>
                  </div>
                )}
                {selectedOrder.gpsLocation && (
                  <div className='col-span-2'>
                    <span className='text-xs text-slate-400 font-bold block'>🛰️ GPS COORDINATES</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.gpsLocation}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5'
                    >
                      {selectedOrder.gpsLocation} (Open in Google Maps ↗)
                    </a>
                  </div>
                )}
              </div>

              <div>
                <Typography variant='subtitle2' className='font-bold text-slate-800 mb-2'>
                  👥 Registered Devotees ({selectedOrder.devotees?.length || 0})
                </Typography>
                <div className='space-y-3'>
                  {selectedOrder.devotees?.map((devotee, index) => (
                    <div key={index} className='p-3 bg-white border border-slate-150 rounded-xl flex flex-col gap-1 shadow-sm'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-slate-700'>
                          #{index + 1} {devotee.name}
                          {devotee.nameLocal ? ` (${devotee.nameLocal})` : ''}
                        </span>
                        {index === 0 && <Chip label='Primary Contact' size='small' className='bg-orange-50 text-orange-700 border-orange-100 border' />}
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-xs text-slate-500 mt-1'>
                        <div>📞 Mobile: <strong>{devotee.phone || '—'}</strong></div>
                        <div>🏵️ Gotra: <strong>{devotee.gotra || '—'}</strong></div>
                        <div>🎂 DOB: <strong>{devotee.dob || '—'}</strong></div>
                        <div>✉️ Email: <strong>{devotee.email || '—'}</strong></div>
                        <div className='col-span-2'>📍 Address: <strong>{devotee.locality ? `${devotee.locality}, ` : ''}{devotee.city ? `${devotee.city}, ` : ''}{devotee.state || '—'} {devotee.pincode ? `(${devotee.pincode})` : ''}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions className='justify-between px-6 pb-4'>
          <Button 
            variant='outlined' 
            onClick={() => { setDetailOpen(false); router.push(`/${locale}/apps/mandir-setu/orders/offer/${selectedOrder?.id}`); }} 
            startIcon={<i className='tabler-external-link' />}
            className='border-slate-300 text-slate-700 font-medium text-xs'
          >
            Full Order Details Page
          </Button>
          <Button onClick={() => setDetailOpen(false)} style={{ color: '#FF671F' }} className='font-bold text-xs'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
