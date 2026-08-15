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
        <div className='grid grid-cols-1 sm:grid-cols-4 gap-6'>
          <Card className='p-5 border border-slate-100 shadow-sm text-center'>
            <Typography variant='body2' className='text-slate-400 font-bold tracking-wider mb-1'>PAGE VIEWS</Typography>
            <Typography variant='h3' className='font-black text-slate-700'>{stats.viewsCount}</Typography>
          </Card>

          <Card className='p-5 border border-slate-100 shadow-sm text-center'>
            <Typography variant='body2' className='text-slate-400 font-bold tracking-wider mb-1'>CONFIRMED BOOKINGS</Typography>
            <Typography variant='h3' className='font-black text-emerald-700'>{stats.bookingsCount}</Typography>
          </Card>

          <Card className='p-5 border border-slate-100 shadow-sm text-center'>
            <Typography variant='body2' className='text-slate-400 font-bold tracking-wider mb-1'>CONVERSION RATE</Typography>
            <Typography variant='h3' className='font-black text-blue-700'>{stats.conversionRate}%</Typography>
          </Card>

          <Card className='p-5 border border-slate-100 shadow-sm text-center'>
            <Typography variant='body2' className='text-slate-400 font-bold tracking-wider mb-1'>TOTAL REVENUE</Typography>
            <Typography variant='h3' className='font-black text-slate-800'>₹{stats.totalRevenue.toFixed(2)}</Typography>
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
        <Typography variant='h5' className='font-bold text-slate-800 mb-2'>
          📋 Confirmed Booking Details
        </Typography>
        <Typography variant='body2' color='textSecondary' className='mb-6'>
          Detailed list of successful transactions including primary contact and devotees list.
        </Typography>

        <TableContainer className='border rounded-lg overflow-hidden max-h-[450px] overflow-y-auto'>
          <Table stickyHeader>
            <TableHead className='bg-slate-50'>
              <TableRow>
                <TableCell className='font-bold'>Date</TableCell>
                <TableCell className='font-bold'>Primary Devotee</TableCell>
                <TableCell className='font-bold'>Devotees List</TableCell>
                <TableCell className='font-bold'>Amount Paid</TableCell>
                <TableCell className='font-bold'>Payment Gateway ID</TableCell>
                <TableCell className='font-bold'>Referral</TableCell>
                <TableCell className='font-bold text-right'>Reconciled</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center py-8 text-slate-400'>
                    No completed bookings recorded for this campaign yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className='hover:bg-slate-50/50'>
                    <TableCell className='text-slate-500'>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='font-semibold text-slate-700'>
                      {order.devotees[0]?.name}
                      {order.devotees[0]?.nameLocal ? ` (${order.devotees[0]?.nameLocal})` : ''}
                      <br />
                      <span className='text-xs text-slate-400'>{order.devotees[0]?.phone}</span>
                    </TableCell>
                    <TableCell className='text-xs text-slate-600'>
                      <ul className='list-disc pl-4 space-y-0.5'>
                        {order.devotees.map((d, idx) => (
                          <li key={idx}>
                            {d.name}
                            {d.nameLocal ? ` (${d.nameLocal})` : ''}
                            {` `}(Gotra: {d.gotra}, DOB: {d.dob})
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className='font-bold text-slate-800'>₹{Number(order.amount).toFixed(2)}</TableCell>
                    <TableCell className='text-xs font-mono text-slate-500'>{order.paymentId}</TableCell>
                    <TableCell>
                      {order.referralCode ? (
                        <Chip label={order.referralCode} size='small' className='bg-blue-50 text-blue-700 border-blue-100 border' />
                      ) : (
                        <span className='text-slate-300'>None</span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Chip 
                        label={order.reconciledStatus.replace('RECONCILED_', '')} 
                        size='small'
                        color={order.reconciledStatus.startsWith('RECONCILED') ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div className='flex justify-start mt-6'>
          <Button
            variant='outlined'
            onClick={() => router.push(`/${locale}/apps/mandir-setu/offer-links`)}
            className='border-slate-300 text-slate-700 font-bold'
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}
