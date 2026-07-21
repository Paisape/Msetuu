'use client'

import { useState, useEffect, useCallback } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

import AdminCredentialsPanel from '@/components/admin/AdminCredentialsPanel'

type FieldMeta = { key: string; label: string; secret: boolean; placeholder?: string }

const PG_FIELDS: FieldMeta[] = [
  { key: 'RAZORPAY_KEY_ID', label: 'Razorpay Key ID', secret: false, placeholder: 'rzp_test_xxxxxxxxxxxx' },
  { key: 'RAZORPAY_KEY_SECRET', label: 'Razorpay Key Secret', secret: true }
]

// Razorpay doesn't have a separate "sandbox vs production" toggle in this app — the mode is
// entirely determined by which key pair you paste in here. Test keys always start with
// "rzp_test_", live keys with "rzp_live_" (issued only after Razorpay completes your account's
// KYC/activation on their dashboard). This badge just reads that prefix back so it's obvious
// at a glance which mode is currently active, without needing to remember the convention.
const detectRazorpayMode = (keyId: string): { label: string; color: 'success' | 'warning' | 'default' } => {
  if (!keyId) return { label: 'Not configured', color: 'default' }
  if (keyId.startsWith('rzp_live_')) return { label: 'LIVE — real payments', color: 'warning' }
  if (keyId.startsWith('rzp_test_')) return { label: 'TEST / Sandbox — no real money moves', color: 'success' }

  return { label: 'Unrecognized key format', color: 'default' }
}

const EMAIL_FIELDS: FieldMeta[] = [
  { key: 'SMTP_HOST', label: 'SMTP Host', secret: false, placeholder: 'smtp.zoho.in' },
  { key: 'SMTP_PORT', label: 'SMTP Port', secret: false, placeholder: '465' },
  { key: 'SMTP_SECURE', label: 'Use SSL (true / false)', secret: false, placeholder: 'true' },
  { key: 'SMTP_USER', label: 'SMTP Username', secret: false, placeholder: 'admin@mandirsetuu.com' },
  { key: 'SMTP_PASSWORD', label: 'SMTP Password', secret: true },
  { key: 'SMTP_FROM_NAME', label: 'From Name', secret: false, placeholder: 'Mandirsetuu' },
  { key: 'SMTP_FROM_EMAIL', label: 'From Email', secret: false, placeholder: 'admin@mandirsetuu.com' }
]

const SMS_FIELDS: FieldMeta[] = [
  { key: 'SMS_PROVIDER', label: 'SMS Provider', secret: false, placeholder: 'e.g. MSG91, Twilio' },
  { key: 'SMS_API_KEY', label: 'SMS API Key', secret: true },
  { key: 'SMS_API_SECRET', label: 'SMS API Secret', secret: true },
  { key: 'SMS_SENDER_ID', label: 'Sender ID', secret: false, placeholder: '6-character sender ID' }
]

const ASTROLOGY_FIELDS: FieldMeta[] = [
  { key: 'ASTROLOGY_API_KEY', label: 'FreeAstrologyAPI Key (Panchang/Choghadiya)', secret: true },
  { key: 'ASTROLOGYAPI_USER_ID', label: 'AstrologyAPI.com User ID (Rashifal)', secret: false },
  { key: 'ASTROLOGYAPI_API_KEY', label: 'AstrologyAPI.com API Key (Rashifal)', secret: true }
]

const ADSENSE_FIELDS: FieldMeta[] = [
  { key: 'ADSENSE_CLIENT_ID', label: 'Google AdSense Publisher Client ID', secret: false, placeholder: 'ca-pub-XXXXXXXXXXXXXXXX' },
  { key: 'ADSENSE_AUTO_ADS_ENABLED', label: 'Enable Auto-Ads (true / false)', secret: false, placeholder: 'true' },
  { key: 'ADSENSE_PREROLL_ENABLED', label: 'Enable Pre-Roll Video/VR Ad (true / false)', secret: false, placeholder: 'true' },
  { key: 'ADSENSE_PREROLL_SECONDS', label: 'Pre-Roll Countdown Duration (Seconds)', secret: false, placeholder: '5' },
  { key: 'ADSENSE_OVERLAY_ADS_ENABLED', label: 'Enable On-Screen Player Overlay Ad (true / false)', secret: false, placeholder: 'true' },
  { key: 'ADSENSE_PREROLL_SLOT_ID', label: 'Pre-Roll & Overlay Ad Slot ID', secret: false, placeholder: '1122334455' },
  { key: 'ADSENSE_HEADER_SLOT_ID', label: 'Top Banner Ad Slot ID', secret: false, placeholder: '1234567890' },
  { key: 'ADSENSE_BOTTOM_SLOT_ID', label: 'Bottom Banner Ad Slot ID', secret: false, placeholder: '0987654321' },
  { key: 'ADSENSE_SIDEBAR_SLOT_ID', label: 'Sidebar Ad Slot ID', secret: false, placeholder: '5678901234' }
]

const WHATSAPP_FIELDS: FieldMeta[] = [
  { key: 'WHATSAPP_PROVIDER', label: 'WhatsApp Provider', secret: false, placeholder: 'Meta Cloud API, Interakt, AiSensy' },
  { key: 'WHATSAPP_API_KEY', label: 'WhatsApp API Key / Access Token', secret: true },
  { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'WhatsApp Phone Number ID', secret: false }
]

const FIREBASE_FIELDS: FieldMeta[] = [
  { key: 'FIREBASE_PROJECT_ID', label: 'Firebase Project ID', secret: false, placeholder: 'mandirsetuu-app' },
  { key: 'FIREBASE_SERVER_KEY', label: 'Firebase FCM Server Key', secret: true }
]

type FieldEntry = { value: string; configured: boolean; source: 'db' | 'env' | 'none' }

// A single settings form (PG / Email / SMS) — loads redacted values from its endpoint, lets the
// admin edit, and saves only changed fields. Secret fields always start blank on load; the
// helper text shows whether one is currently configured (and its masked preview) without ever
// exposing the real value to the browser.
const SettingsPanel = ({
  endpoint,
  fields,
  extra,
  renderExtra
}: {
  endpoint: string
  fields: FieldMeta[]
  extra?: React.ReactNode

  // Like `extra`, but receives the panel's live (unsaved-included) field values — for content
  // that needs to react as the admin types, e.g. the Razorpay mode badge below.
  renderExtra?: (values: Record<string, string>) => React.ReactNode
}) => {
  const [loading, setLoading] = useState(true)
  const [values, setValues] = useState<Record<string, string>>({})
  const [meta, setMeta] = useState<Record<string, FieldEntry>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(endpoint)
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to load settings.')

      const initialValues: Record<string, string> = {}
      const initialMeta: Record<string, FieldEntry> = {}

      for (const f of fields) {
        const entry: FieldEntry | undefined = data[f.key]

        initialValues[f.key] = f.secret ? '' : entry?.value || ''
        initialMeta[f.key] = entry || { value: '', configured: false, source: 'none' }
      }

      setValues(initialValues)
      setMeta(initialMeta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }, [endpoint, fields])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to save settings.')

      setSuccess('Settings saved.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-6 text-center'>
        <CircularProgress size={22} />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {fields.map(f => {
        const entry = meta[f.key]

        const helperText = entry?.configured
          ? f.secret
            ? `Currently set (${entry.value || '••••'}). Source: ${entry.source === 'db' ? 'admin panel' : 'server .env'}. Leave blank to keep unchanged.`
            : `Source: ${entry.source === 'db' ? 'admin panel' : 'server .env'}`
          : 'Not configured yet.'

        return (
          <TextField
            key={f.key}
            label={f.label}
            type={f.secret ? 'password' : 'text'}
            value={values[f.key] || ''}
            onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            helperText={helperText}
            fullWidth
            size='small'
            autoComplete='new-password'
          />
        )
      })}
      <Box className='flex items-center gap-3'>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color='inherit' /> : 'Save'}
        </Button>
        {extra}
        {renderExtra?.(values)}
      </Box>
    </div>
  )
}

const EmailTestButton = () => {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleTest = async () => {
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/secure-config/settings/email/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to send test email.')

      setResult({ type: 'success', message: `Test email sent to ${data.sentTo}.` })
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send test email.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='flex items-center gap-3'>
      <Button variant='outlined' onClick={handleTest} disabled={sending}>
        {sending ? <CircularProgress size={18} /> : 'Send Test Email'}
      </Button>
      {result && (
        <Typography variant='body2' className={result.type === 'success' ? 'text-success' : 'text-error'}>
          {result.message}
        </Typography>
      )}
    </div>
  )
}

type Status = { unlocked: boolean; rotationRequired: boolean; daysSinceChange: number }

const ConfigClient = () => {
  const [status, setStatus] = useState<Status | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const [phase, setPhase] = useState<'password' | 'rotate'>('password')
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  const [otpRequested, setOtpRequested] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rotateError, setRotateError] = useState<string | null>(null)
  const [rotating, setRotating] = useState(false)

  const [tabIndex, setTabIndex] = useState(0)

  const loadStatus = useCallback(async () => {
    setStatusLoading(true)

    try {
      const res = await fetch('/api/secure-config/status')
      const data = await res.json().catch(() => null)

      if (res.ok) {
        setStatus(data)
        if (data.rotationRequired) setPhase('rotate')
      }
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleUnlock = async () => {
    setUnlocking(true)
    setUnlockError(null)

    try {
      const res = await fetch('/api/secure-config/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (data?.rotationRequired) {
          setPhase('rotate')
          await loadStatus()

          return
        }

        throw new Error(data?.error || 'Incorrect Config password.')
      }

      setPassword('')
      await loadStatus()
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Incorrect Config password.')
    } finally {
      setUnlocking(false)
    }
  }

  const handleRequestOtp = async () => {
    setOtpSending(true)
    setRotateError(null)

    try {
      const res = await fetch('/api/secure-config/rotate/request-otp', { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to send OTP.')

      setOtpRequested(true)
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : 'Failed to send OTP.')
    } finally {
      setOtpSending(false)
    }
  }

  const handleConfirmRotation = async () => {
    setRotateError(null)

    if (newPassword !== confirmPassword) {
      setRotateError('New password and confirmation do not match.')

      return
    }

    setRotating(true)

    try {
      const res = await fetch('/api/secure-config/rotate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, newPassword })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to rotate password.')

      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setOtpRequested(false)
      await loadStatus()
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : 'Failed to rotate password.')
    } finally {
      setRotating(false)
    }
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-1'>
        Config
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-6'>
        Payment gateway, email, and SMS credentials. Protected by a secondary password, separate from your admin
        login. This password must be rotated every 15 days via an OTP emailed to the recovery address.
      </Typography>

      <Card className='mb-6'>
        <CardHeader
          title='Admin Login Credentials'
          subheader='Change your active Admin Email Address and Admin Password.'
        />
        <CardContent>
          <AdminCredentialsPanel />
        </CardContent>
      </Card>

      {statusLoading ? (
        <div className='p-6 text-center'>
          <CircularProgress size={22} />
        </div>
      ) : status?.unlocked ? (
        <Card>
          <CardHeader
            title='PG · Email · SMS'
            subheader={`Config session active — ${status.daysSinceChange} day(s) since the password was last changed.`}
          />
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 4 }}>
            <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
              <Tab label='PG' />
              <Tab label='Email' />
              <Tab label='SMS' />
              <Tab label='Astrology' />
              <Tab label='Google AdSense' />
              <Tab label='WhatsApp' />
              <Tab label='Firebase Push' />
            </Tabs>
          </Box>
          <CardContent>
            {tabIndex === 0 && (
              <>
                <Typography variant='body2' className='text-textSecondary mb-4'>
                  There is no separate sandbox/production switch — Razorpay determines the mode from which key
                  pair you paste below. Use your <strong>Test Mode</strong> keys (Razorpay Dashboard → Settings →
                  API Keys → Test Mode) while building/testing, and swap in your <strong>Live Mode</strong> keys
                  (only issued after Razorpay activates your account) when you're ready to accept real payments.
                </Typography>
                <SettingsPanel
                  endpoint='/api/secure-config/settings/pg'
                  fields={PG_FIELDS}
                  renderExtra={values => {
                    const mode = detectRazorpayMode(values['RAZORPAY_KEY_ID'] || '')

                    return <Chip size='small' label={`Mode: ${mode.label}`} color={mode.color} />
                  }}
                />
              </>
            )}
            {tabIndex === 1 && (
              <SettingsPanel endpoint='/api/secure-config/settings/email' fields={EMAIL_FIELDS} extra={<EmailTestButton />} />
            )}
            {tabIndex === 2 && (
              <>
                <Chip size='small' label='No SMS provider is wired up yet — this only saves the config.' className='mb-4' />
                <SettingsPanel endpoint='/api/secure-config/settings/sms' fields={SMS_FIELDS} />
              </>
            )}
            {tabIndex === 3 && (
              <>
                <Chip size='small' label='Panchang: freeastrologyapi.com — Rashifal: astrologyapi.com (separate providers)' className='mb-4' />
                <SettingsPanel endpoint='/api/secure-config/settings/astrology' fields={ASTROLOGY_FIELDS} />
              </>
            )}
            {tabIndex === 4 && (
              <>
                <Chip size='small' label='Monetize VR Experiences & Mandirsetuu Pages with Google AdSense Auto-Ads & Banner Ad Units' className='mb-4' />
                <SettingsPanel endpoint='/api/secure-config/settings/adsense' fields={ADSENSE_FIELDS} />
              </>
            )}
            {tabIndex === 5 && (
              <>
                <Chip size='small' label='Configure Meta WhatsApp Cloud API, Interakt, or AiSensy for instant WhatsApp notifications' className='mb-4' />
                <SettingsPanel endpoint='/api/secure-config/settings/whatsapp' fields={WHATSAPP_FIELDS} />
              </>
            )}
            {tabIndex === 6 && (
              <>
                <Chip size='small' label='Configure Firebase Cloud Messaging (FCM) Server Key for mobile & web push notifications' className='mb-4' />
                <SettingsPanel endpoint='/api/secure-config/settings/firebase' fields={FIREBASE_FIELDS} />
              </>
            )}
          </CardContent>
        </Card>
      ) : phase === 'rotate' ? (
        <Card>
          <CardHeader
            title='Password rotation required'
            subheader='It has been 15 or more days since the Config password was last changed. An OTP must be emailed to the recovery address before it can be reset.'
          />
          <CardContent>
            {rotateError && (
              <Alert severity='error' className='mb-4' onClose={() => setRotateError(null)}>
                {rotateError}
              </Alert>
            )}

            {!otpRequested ? (
              <Button variant='contained' onClick={handleRequestOtp} disabled={otpSending}>
                {otpSending ? <CircularProgress size={18} color='inherit' /> : 'Send OTP to recovery email'}
              </Button>
            ) : (
              <div className='flex flex-col gap-4' style={{ maxWidth: 360 }}>
                <Alert severity='info'>An OTP has been emailed to the recovery address. It expires in 10 minutes.</Alert>
                <TextField
                  label='OTP'
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  size='small'
                  fullWidth
                  inputProps={{ maxLength: 6 }}
                />
                <TextField
                  label='New Config Password'
                  type='password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  size='small'
                  fullWidth
                  autoComplete='new-password'
                />
                <TextField
                  label='Confirm New Password'
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  size='small'
                  fullWidth
                  autoComplete='new-password'
                />
                <Box className='flex items-center gap-3'>
                  <Button variant='contained' onClick={handleConfirmRotation} disabled={rotating}>
                    {rotating ? <CircularProgress size={18} color='inherit' /> : 'Set New Password'}
                  </Button>
                  <Button variant='text' onClick={handleRequestOtp} disabled={otpSending}>
                    Resend OTP
                  </Button>
                </Box>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader title='Enter Config Password' />
          <CardContent>
            {unlockError && (
              <Alert severity='error' className='mb-4' onClose={() => setUnlockError(null)}>
                {unlockError}
              </Alert>
            )}
            <div className='flex flex-col gap-4' style={{ maxWidth: 360 }}>
              <TextField
                label='Config Password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleUnlock()
                }}
                size='small'
                fullWidth
                autoComplete='off'
              />
              <Button variant='contained' onClick={handleUnlock} disabled={unlocking || !password}>
                {unlocking ? <CircularProgress size={18} color='inherit' /> : 'Unlock'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ConfigClient
