'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, minLength, string, pipe, nonEmpty, optional, check } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import AuthIllustration from '@/components/AuthIllustration'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
  maxInlineSize: '100%',
  objectFit: 'cover',
  borderRadius: '16px',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 345,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

type FormData = InferInput<typeof schema>

const schema = object({
  name: pipe(string(), nonEmpty('This field is required')),
  email: pipe(
    string(),
    check((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Email is invalid')
  ),
  phone: pipe(string(), nonEmpty('This field is required'), minLength(10, 'Mobile number must be at least 10 digits')),
  password: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(8, 'Password must be at least 8 characters long')
  ),
  referralCode: optional(string())
})

const Register = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [countryCode, setCountryCode] = useState('+91')

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const [customBanner, setCustomBanner] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/banners?page=register')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomBanner(data[0].image)
        }
      })
      .catch(err => console.error(err))
  }, [])

  const characterIllustration = customBanner || useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '', referralCode: '' }
  })

  useEffect(() => {
    const refCode = searchParams.get('ref') || ''
    if (refCode) {
      setValue('referralCode', refCode)
    }
  }, [searchParams, setValue])

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormData> = async data => {
    setSubmitError(null)

    if (!agreed) {
      setSubmitError('Please agree to the privacy policy & terms to continue.')
      return
    }

    // Dynamic country validations
    if (countryCode === '+91') {
      if (!data.phone || data.phone.trim().length < 10) {
        setError('phone', { type: 'manual', message: 'Mobile number is required and must be at least 10 digits for Indian users.' })
        return
      }
    } else {
      if (!data.email || data.email.trim() === '') {
        setError('email', { type: 'manual', message: 'Email is compulsory for customers outside India.' })
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setError('email', { type: 'manual', message: 'Please enter a valid email address.' })
        return
      }
    }

    setSubmitting(true)
    const fullPhone = data.phone && data.phone.trim() !== '' ? `${countryCode}${data.phone.replace(/^\+/, '').trim()}` : null

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: fullPhone
        })
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setSubmitError(json?.error || 'Unable to register. Please try again.')
        setSubmitting(false)
        return
      }

      if (json?.requireVerification) {
        // Automatically send the registration OTP (SMS OTP is Indian only)
        const otpPromises = []

        if (countryCode === '+91' && fullPhone) {
          otpPromises.push(
            fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contact: fullPhone, type: 'SMS', purpose: 'REGISTER' })
            }).catch(() => null)
          )
        }

        if (data.email && data.email.trim() !== '') {
          otpPromises.push(
            fetch('/api/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contact: data.email.trim(), type: 'EMAIL', purpose: 'REGISTER' })
            }).catch(() => null)
          )
        }

        await Promise.all(otpPromises)

        // Redirect to OTP verification page
        const phoneParam = countryCode === '+91' && fullPhone ? `?phone=${encodeURIComponent(fullPhone)}` : ''
        const emailParam = data.email && data.email.trim() !== ''
          ? `${phoneParam ? '&' : '?'}email=${encodeURIComponent(data.email.trim())}`
          : ''

        router.replace(getLocalizedUrl(`/verify-otp${phoneParam}${emailParam}`, locale as Locale))
      } else {
        // Fallback for non-verification mode
        const signInRes = await signIn('credentials', { email: data.email || fullPhone, password: data.password, redirect: false })

        if (signInRes?.ok && signInRes.error === null) {
          router.replace(getLocalizedUrl('/', locale as Locale))
        } else {
          router.replace(getLocalizedUrl('/login', locale as Locale))
        }
      }
    } catch {
      setSubmitError('Unable to register. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <AuthIllustration />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href={getLocalizedUrl('/login', locale as Locale)}
          className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>Devotion Starts Here 🪔</Typography>
            <Typography>Makes your devotion journey easy and joyful</Typography>
          </div>
          {submitError && <Alert severity='error'>{submitError}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='name'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  label='Full name'
                  placeholder='Enter your full name'
                  {...(errors.name && { error: true, helperText: errors.name.message })}
                />
              )}
            />
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Email (Optional)'
                  placeholder='Enter your email (optional)'
                  {...(errors.email && { error: true, helperText: errors.email.message })}
                />
              )}
            />
            <Box className='flex gap-2 items-start'>
              <CustomTextField
                select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                slotProps={{
                  select: {
                    native: true
                  }
                }}
                sx={{ minWidth: 90 }}
              >
                <option value='+91'>🇮🇳 +91</option>
                <option value='+1'>🇺🇸 +1</option>
                <option value='+44'>🇬🇧 +44</option>
                <option value='+61'>🇦🇺 +61</option>
                <option value='+971'>🇦🇪 +971</option>
                <option value='+966'>🇸🇦 +966</option>
                <option value='+81'>🇯🇵 +81</option>
                <option value='+86'>🇨🇳 +86</option>
                <option value='+7'>🇷🇺 +7</option>
                <option value='+49'>🇩🇪 +49</option>
              </CustomTextField>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Mobile Number'
                    placeholder='Enter mobile number'
                    {...(errors.phone && { error: true, helperText: errors.phone.message })}
                  />
                )}
              />
            </Box>
            <Typography variant='caption' className='text-slate-400 block -mt-4'>
              * Email is compulsory for customers outside India. SMS OTP is only supported for Indian mobile numbers (+91).
            </Typography>
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                            <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />
            <Controller
              name='referralCode'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Referral Code (Optional)'
                  placeholder='Enter referral code'
                  {...(errors.referralCode && { error: true, helperText: errors.referralCode.message })}
                />
              )}
            />
            <FormControlLabel
              control={<Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)} />}
              label={
                <>
                  <span>I agree to </span>
                  <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                    privacy policy & terms
                  </Link>
                </>
              }
            />
            <Button fullWidth variant='contained' type='submit' disabled={submitting}>
              {submitting ? <CircularProgress size={22} /> : 'Sign Up'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Already have an account?</Typography>
              <Typography component={Link} href={getLocalizedUrl('/login', locale as Locale)} color='primary.main'>
                Sign in instead
              </Typography>
            </div>
            <Divider className='gap-2'>or</Divider>
            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'>
                <i className='tabler-brand-facebook-filled' />
              </IconButton>
              <IconButton className='text-twitter' size='small'>
                <i className='tabler-brand-twitter-filled' />
              </IconButton>
              <IconButton className='text-textPrimary' size='small'>
                <i className='tabler-brand-github-filled' />
              </IconButton>
              <IconButton className='text-error' size='small'>
                <i className='tabler-brand-google-filled' />
              </IconButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
