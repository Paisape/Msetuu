'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

const ContactUs = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()

  // Contact form state
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to send your message. Please try again.')

      setSuccess(true)
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send your message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (skipIntersection.current) {
          skipIntersection.current = false

          return
        }

        updateIntersections({ [entry.target.id]: entry.isIntersecting })
      },
      { threshold: 0.35 }
    )

    ref.current && observer.observe(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id='contact-us' className='py-8 px-6 max-w-7xl mx-auto' ref={ref}>
      <div className={classnames('flex flex-col gap-10', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip
            size='small'
            variant='tonal'
            label='Contact Us'
            style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#006241', fontWeight: 'bold' }}
          />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography variant='h4' style={{ color: '#006241', fontWeight: 800 }}>
                <span className='relative z-[1] font-extrabold'>
                  Let&#39;s work
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='bg-shape'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[132%] -inline-start-[19%] block-start-[17px]'
                  />
                </span>{' '}
                together
              </Typography>
            </div>
            <Typography className='text-center' style={{ color: '#4b5563' }}>Any question or remark? just write us a message</Typography>
          </div>
        </div>
        <div className='lg:pis-[38px]'>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 6, lg: 5 }}>
              <div className={classnames('border p-[10px] relative', styles.contactRadius)} style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                <img
                  src='/images/front-pages/landing-page/contact-border.png'
                  className='absolute -block-start-[7%] -inline-start-[8%] max-is-full max-lg:hidden '
                  alt='contact-border'
                  width='180'
                />
                <img
                  src='/images/front-pages/landing-page/customer-service.png'
                  alt='customer-service'
                  className={classnames('is-full', styles.contactRadius)}
                />
                <div className='flex justify-between flex-wrap gap-4 pli-6 pbs-4 pbe-[10px]'>
                  <div className='flex gap-3'>
                    <CustomAvatar variant='rounded' size={36} style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#006241' }}>
                      <i className='tabler-mail' />
                    </CustomAvatar>
                    <div>
                      <Typography variant='body2' style={{ color: '#6b7280' }}>Email</Typography>
                      <Typography className='font-medium' style={{ color: '#1e293b' }}>
                        admin@mandirsetuu.com
                      </Typography>
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <CustomAvatar variant='rounded' size={36} style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#006241' }}>
                      <i className='tabler-phone' />
                    </CustomAvatar>
                    <div>
                      <Typography variant='body2' style={{ color: '#6b7280' }}>Phone</Typography>
                      <Typography className='font-medium' style={{ color: '#1e293b' }}>
                        +91 98765 43210
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 7 }}>
              <Card className='galaxy-card h-full p-4'>
                <CardContent>
                  <div className='flex flex-col gap-y-[6px] mbe-6'>
                    <Typography variant='h4' style={{ color: '#006241', fontWeight: 800 }}>Send a message</Typography>
                    <Typography style={{ color: '#4b5563' }}>
                      If you would like to discuss anything related to payment, account, licensing, partnerships, or
                      have pre-sales questions, you&#39;re at the right place.
                    </Typography>
                  </div>
                  {success ? (
                    <Alert severity='success'>Thank you! Your message has been sent — we'll get back to you shortly.</Alert>
                  ) : (
                    <form className='flex flex-col items-start gap-6' onSubmit={handleSubmit}>
                      {errorMsg && (
                        <Alert severity='error' className='is-full' onClose={() => setErrorMsg('')}>
                          {errorMsg}
                        </Alert>
                      )}
                      <div className='flex gap-5 is-full max-sm:flex-col'>
                        <CustomTextField
                          fullWidth
                          required
                          label='Full name'
                          id='name-input'
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          sx={{
                            '& .MuiInputLabel-root': { color: '#6b7280' },
                            '& .MuiOutlinedInput-root': {
                              color: '#0f172a',
                              '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                              '&:hover fieldset': { borderColor: '#10b981' }
                            }
                          }}
                        />
                        <CustomTextField
                          fullWidth
                          required
                          label='Email address'
                          id='email-input'
                          type='email'
                          value={formData.email}
                          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          sx={{
                            '& .MuiInputLabel-root': { color: '#6b7280' },
                            '& .MuiOutlinedInput-root': {
                              color: '#0f172a',
                              '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                              '&:hover fieldset': { borderColor: '#10b981' }
                            }
                          }}
                        />
                      </div>
                      <CustomTextField
                        fullWidth
                        required
                        multiline
                        rows={6}
                        label='Message'
                        id='message-input'
                        value={formData.message}
                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        sx={{
                          '& .MuiInputLabel-root': { color: '#6b7280' },
                          '& .MuiOutlinedInput-root': {
                            color: '#0f172a',
                            '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.2)' },
                            '&:hover fieldset': { borderColor: '#10b981' }
                          }
                        }}
                      />
                      <Button type='submit' variant='contained' className='galaxy-glow-btn font-bold px-6' disabled={submitting}>
                        {submitting ? <CircularProgress size={18} color='inherit' /> : 'Send Inquiry'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>
      </div>
    </section>
  )
}

export default ContactUs
