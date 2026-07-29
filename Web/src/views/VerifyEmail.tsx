'use client'

import { useState } from 'react'

import { useParams, useRouter, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'

import type { SystemMode } from '@core/types'
import type { Locale } from '@configs/i18n'

import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'
import CustomTextField from '@core/components/mui/TextField'

import { getLocalizedUrl } from '@/utils/i18n'


type FormData = {
  emailOtp?: string
  phoneOtp?: string
}

const VerifyEmail = ({ mode }: { mode: SystemMode }) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const phone = searchParams.get('phone') || ''

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: { emailOtp: '', phoneOtp: '' }
  })

  const onSubmit: SubmitHandler<FormData> = async data => {
    setSubmitError(null)
    setSubmitSuccess(null)
    setSubmitting(true)

    try {
      const promises = []
      
      if (email) {
        if (!data.emailOtp || data.emailOtp.length !== 6) {
          setSubmitError('Please enter a valid 6-digit Email OTP.')
          setSubmitting(false)
          return
        }
        promises.push(
          fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact: email, otp: data.emailOtp, purpose: 'REGISTER' })
          })
        )
      }
      
      if (phone) {
        if (!data.phoneOtp || data.phoneOtp.length !== 6) {
          setSubmitError('Please enter a valid 6-digit Mobile OTP.')
          setSubmitting(false)
          return
        }
        promises.push(
          fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact: phone, otp: data.phoneOtp, purpose: 'REGISTER' })
          })
        )
      }

      if (promises.length === 0) {
        setSubmitError('No contact information provided to verify.')
        setSubmitting(false)
        return
      }

      const results = await Promise.all(promises)
      
      for (const res of results) {
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          setSubmitError(json?.error || 'Unable to verify account.')
          setSubmitting(false)
          return
        }
      }

      setSubmitSuccess('Account verified successfully! Redirecting to login...')
      setTimeout(() => {
        router.replace(getLocalizedUrl('/login', locale as Locale))
      }, 2000)
    } catch {
      setSubmitError('Unable to verify account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex justify-center items-center min-h-screen'>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={getLocalizedUrl('/', locale as Locale)} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Verify your account 🛡️</Typography>
            <Typography>
              Activation codes were sent to your registered contacts.
              Please enter the 6-digit codes below to continue.
            </Typography>
          </div>
          {submitError && <Alert severity='error' className='mbe-6'>{submitError}</Alert>}
          {submitSuccess && <Alert severity='success' className='mbe-6'>{submitSuccess}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            
            {email && (
              <Controller
                name='emailOtp'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    autoFocus
                    fullWidth
                    label={`Email Code (${email})`}
                    placeholder='123456'
                  />
                )}
              />
            )}
            
            {phone && (
              <Controller
                name='phoneOtp'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label={`Mobile Code (${phone})`}
                    placeholder='123456'
                  />
                )}
              />
            )}

            <Button fullWidth variant='contained' type='submit' disabled={submitting || (!email && !phone)}>
              {submitting ? <CircularProgress size={22} /> : 'Verify Account'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Need a new code?</Typography>
              <Typography color='primary.main' component={Link} href={getLocalizedUrl('/register', locale as Locale)}>
                Register Again
              </Typography>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyEmail
