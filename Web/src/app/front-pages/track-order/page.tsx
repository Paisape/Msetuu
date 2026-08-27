'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [orderIdInput, setOrderIdInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchOrderDetails = async (id: string) => {
    setLoading(true)
    setErrorMsg(null)
    setOrder(null)
    try {
      const res = await fetch(`/api/orders/track?id=${id.trim()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Order lookup failed.')
      setOrder(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not find any order with that ID.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setOrderIdInput(id)
      fetchOrderDetails(id)
    }
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderIdInput.trim()) return
    fetchOrderDetails(orderIdInput)
  }

  // Get active step index based on status
  const getActiveStep = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0
      case 'PROCESSING':
        return 1
      case 'COMPLETED':
        return 2
      default:
        return 0
    }
  }

  const steps = ['Order Placed', 'Processing Offering', 'Completed / Proof Uploaded']

  return (
    <div className='flex flex-col items-center justify-start min-h-screen bg-[#FAF8EB] p-4 py-12 w-full'>
      <div className='max-w-2xl w-full flex flex-col gap-6'>
        {/* Header */}
        <div className='text-center flex flex-col gap-2'>
          <Typography variant='h4' className='font-black text-[#006241]'>
            Track Your Puja/Offering
          </Typography>
          <Typography variant='body2' className='text-slate-600'>
            Enter your short Order ID to view booking status and watch the video proof.
          </Typography>
        </div>

        {/* Search Input Card */}
        <Card className='shadow-md border border-slate-100 rounded-2xl'>
          <CardContent className='p-6'>
            <form onSubmit={handleSearch} className='flex flex-col sm:flex-row gap-3 items-stretch sm:items-center'>
              <TextField
                label='Order ID'
                placeholder='e.g., MS7A8Y3P'
                variant='outlined'
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value)}
                fullWidth
                size='medium'
              />
              <Button
                type='submit'
                variant='contained'
                disabled={loading}
                className='px-8 py-3.5 bg-[#FF671F] hover:bg-[#e05615] text-white font-bold rounded-xl whitespace-nowrap'
                style={{ backgroundColor: '#FF671F' }}
              >
                {loading ? <CircularProgress size={24} color='inherit' /> : 'Track Order'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <Alert severity='error' className='rounded-xl shadow-sm'>
            {errorMsg}
          </Alert>
        )}

        {/* Order Details Display Card */}
        {order && (
          <Card className='shadow-lg border border-orange-100 rounded-2xl overflow-hidden'>
            {/* Header Badge */}
            <div className='bg-[#FF671F]/10 border-b border-orange-100 p-4 px-6 flex justify-between items-center'>
              <div>
                <Typography variant='caption' className='text-[#FF671F] font-bold uppercase tracking-wider block'>
                  {order.type}
                </Typography>
                <Typography variant='h6' className='font-black text-slate-800 mt-0.5'>
                  {order.title}
                </Typography>
              </div>
              <code className='px-3 py-1 bg-[#FF671F] text-white font-mono rounded-lg font-bold text-sm'>
                {order.id}
              </code>
            </div>

            <CardContent className='p-6 flex flex-col gap-6'>
              {/* Stepper Status Progress */}
              <Box className='py-4'>
                <Stepper activeStep={getActiveStep(order.status)} alternativeLabel>
                  {steps.map(label => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Devotee Info */}
              <div className='grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-sm'>
                <div>
                  <span className='text-slate-400 block font-medium'>Devotee Name</span>
                  <span className='text-slate-800 font-bold'>{order.name}</span>
                </div>
                <div>
                  <span className='text-slate-400 block font-medium'>Booking Date</span>
                  <span className='text-slate-800 font-bold'>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Video Player Section */}
              {order.videoUrl ? (
                <div className='border-t border-slate-100 pt-6 flex flex-col gap-3'>
                  <Typography variant='subtitle2' className='font-bold text-slate-800 flex items-center gap-1.5'>
                    <i className='tabler-video text-orange-500' /> Video Proof of Offering
                  </Typography>
                  <Paper className='overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center relative shadow-inner'>
                    <iframe
                      src={order.videoUrl}
                      className='w-full h-full border-0 absolute inset-0'
                      allow='autoplay; encrypted-media'
                      allowFullScreen
                    />
                  </Paper>
                  <Button
                    variant='outlined'
                    href={order.videoUrl}
                    target='_blank'
                    className='w-full py-2.5 border-[#FF671F] text-[#FF671F] font-bold hover:bg-orange-50 rounded-xl flex items-center justify-center gap-1.5 mt-2'
                    style={{ borderColor: '#FF671F', color: '#FF671F' }}
                  >
                    Watch Directly on Google Drive ↗
                  </Button>
                </div>
              ) : (
                order.status === 'COMPLETED' && (
                  <div className='p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm text-slate-500 font-medium'>
                    The offering was performed successfully. Video proof is being compiled and will be available shortly!
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="text-center p-12"><CircularProgress /></div>}>
      <TrackOrderContent />
    </Suspense>
  )
}
