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
import { valibotResolver } from '@hookform/resolvers/valibot'
import { object, string, pipe, nonEmpty, length } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'

import type { SystemMode } from '@core/types'
import type { Locale } from '@configs/i18n'

import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'
import CustomTextField from '@core/components/mui/TextField'

import { getLocalizedUrl } from '@/utils/i18n'


type FormData = InferInput<typeof schema>

const schema = object({
  otp: pipe(string(), nonEmpty('This field is required'), length(6, 'Must be exactly 6 characters'))
})

const VerifyEmail = ({ mode }: { mode: SystemMode }) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: { otp: '' }
  })

  const onSubmit: SubmitHandler<FormData> = async data => {
    setSubmitError(null)
    setSubmitSuccess(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp })
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setSubmitError(json?.error || 'Unable to verify email.')
        
return
      }

      setSubmitSuccess('Email verified successfully! Redirecting to login...')
      setTimeout(() => {
        router.replace(getLocalizedUrl('/login', locale as Locale))
      }, 2000)
    } catch {
      setSubmitError('Unable to verify email.')
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
            <Typography variant='h4'>Verify your email ✉️</Typography>
            <Typography>
              An activation code was sent to <span className='font-medium text-textPrimary'>{email || 'your email'}</span>.
              Please enter the 6-digit code below to continue.
            </Typography>
          </div>
          {submitError && <Alert severity='error' className='mbe-6'>{submitError}</Alert>}
          {submitSuccess && <Alert severity='success' className='mbe-6'>{submitSuccess}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='otp'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Verification Code'
                  placeholder='123456'
                  {...(errors.otp && { error: true, helperText: errors.otp.message })}
                />
              )}
            />
            <Button fullWidth variant='contained' type='submit' disabled={submitting || !email}>
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
