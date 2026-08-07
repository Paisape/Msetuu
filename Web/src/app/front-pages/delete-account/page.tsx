'use client'

import { useState } from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

export default function DeleteAccount() {
  const [contact, setContact] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, type: contact.includes('@') ? 'EMAIL' : 'SMS', purpose: 'LOGIN' })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setStep('VERIFY')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/public-delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, otp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      setStep('SUCCESS')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth='sm' className='py-20'>
      <Box className='bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center'>
        <Typography variant='h4' component='h1' className='font-bold mb-4' style={{ color: '#006241' }}>
          Account Deletion
        </Typography>

        {step !== 'SUCCESS' && (
          <>
            <Typography variant='body1' color='text.secondary' className='mb-6'>
              To delete your MandirSetu account and permanently remove your data, please verify your identity using the email or phone number associated with your account.
            </Typography>
            <Alert severity='warning' className='mb-8 text-left'>
              <Typography variant='subtitle2' className='font-bold mb-1'>What happens when you delete your account?</Typography>
              <ul className='list-disc pl-5 mb-0 text-sm'>
                <li>Your profile and login credentials will be permanently erased.</li>
                <li>Your active e-puja and chadhava subscriptions/orders will be disassociated from your identity.</li>
                <li>Your horoscope, kundli, and personal consultation history will be permanently deleted.</li>
                <li>This action is irreversible. You cannot recover your account later.</li>
              </ul>
            </Alert>
          </>
        )}

        {error && <Alert severity='error' className='mb-6 text-left'>{error}</Alert>}

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestOtp} className='flex flex-col gap-4 text-left'>
            <TextField
              label='Email or Phone Number'
              variant='outlined'
              fullWidth
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type='submit'
              variant='contained'
              size='large'
              disabled={loading || !contact}
              className='mt-2'
              style={{ backgroundColor: '#006241', color: 'white' }}
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : 'Send OTP'}
            </Button>
          </form>
        )}

        {step === 'VERIFY' && (
          <form onSubmit={handleDelete} className='flex flex-col gap-4 text-left'>
            <Alert severity='info' className='mb-2'>
              An OTP has been sent to <strong>{contact}</strong>.
            </Alert>
            <TextField
              label='Enter 6-digit OTP'
              variant='outlined'
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
              inputProps={{ maxLength: 6 }}
            />
            <Button
              type='submit'
              variant='contained'
              size='large'
              color='error'
              disabled={loading || otp.length < 6}
              className='mt-2'
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : 'Permanently Delete My Account'}
            </Button>
            <Button
              variant='text'
              onClick={() => setStep('REQUEST')}
              disabled={loading}
              className='mt-2'
              style={{ color: '#64748b' }}
            >
              Back
            </Button>
          </form>
        )}

        {step === 'SUCCESS' && (
          <Box className='py-8'>
            <i className='tabler-check text-6xl text-emerald-500 mb-4' />
            <Typography variant='h5' className='font-bold mb-2'>Account Deleted</Typography>
            <Typography variant='body1' color='text.secondary'>
              Your account and all associated personal data have been permanently deleted from our servers.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  )
}
