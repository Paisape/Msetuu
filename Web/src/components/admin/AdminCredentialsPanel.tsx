'use client'

import { useState, useEffect, useCallback } from 'react'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

export default function AdminCredentialsPanel() {
  const [loading, setLoading] = useState(true)
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // The edit fields (new email/password) stay hidden until the current password is verified —
  // avoids showing an always-editable credentials form to anyone who lands on this tab.
  const [unlocked, setUnlocked] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpEnabled, setOtpEnabled] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setVerifyError(null)
    try {
      const res = await fetch('/api/admin/update-credentials')
      const data = await res.json()
      if (res.ok && data.email) {
        setCurrentEmail(data.email)
        setNewEmail(data.email)
        setOtpEnabled(!!data.otpEnabled)
      } else {
        setVerifyError(data?.error || 'Failed to load admin profile.')
      }
    } catch {
      setVerifyError('Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyError(null)

    if (!currentPassword) {
      setVerifyError('Please enter your current password.')
      return
    }

    setVerifying(true)
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Incorrect password.')
      }

      setUnlocked(true)
    } catch (err: any) {
      setVerifyError(err.message || 'Incorrect password.')
    } finally {
      setVerifying(false)
    }
  }

  const handleLock = () => {
    setUnlocked(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setNewEmail(currentEmail)
    setError(null)
    setSuccess(null)
    loadData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword) {
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match.')
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newEmail: newEmail.trim(),
          newPassword: newPassword.trim(),
          otpEnabled
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update credentials.')
      }

      setSuccess(data.message || 'Credentials updated successfully.')
      if (data.newEmail) {
        setCurrentEmail(data.newEmail)
        setNewEmail(data.newEmail)
      }
      // Re-lock after a successful save — the admin re-enters their (possibly just-changed)
      // password to make another change, rather than leaving the form open indefinitely.
      setUnlocked(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-6 text-center'>
        <CircularProgress size={24} />
      </div>
    )
  }

  if (!unlocked) {
    return (
      <Box component='form' onSubmit={handleVerify} className='flex flex-col gap-5' style={{ maxWidth: 420 }}>
        <Typography variant='body2' color='textSecondary'>
          Enter your current admin password to unlock the email/password change form.
        </Typography>

        {verifyError && (
          <Alert severity='error' onClose={() => setVerifyError(null)}>
            {verifyError}
          </Alert>
        )}
        {success && (
          <Alert severity='success' onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <TextField
          label='Current Admin Email'
          value={currentEmail}
          disabled
          size='small'
          fullWidth
          helperText='Current active email registered in system'
        />

        <TextField
          label='Current Admin Password'
          type='password'
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          size='small'
          fullWidth
          required
          autoComplete='current-password'
        />

        <Box className='flex items-center gap-3'>
          <Button variant='contained' type='submit' disabled={verifying}>
            {verifying ? <CircularProgress size={18} color='inherit' /> : 'Verify & Continue'}
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box component='form' onSubmit={handleSubmit} className='flex flex-col gap-5' style={{ maxWidth: 500 }}>
      <Typography variant='body2' color='textSecondary'>
        Update your Admin Email Address and Admin Password below.
      </Typography>

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        label='Current Admin Email'
        value={currentEmail}
        disabled
        size='small'
        fullWidth
      />

      <TextField
        label='New Admin Email Address'
        type='email'
        value={newEmail}
        onChange={e => setNewEmail(e.target.value)}
        size='small'
        fullWidth
        required
        helperText='Enter the email address you will use to log in as admin'
      />

      <TextField
        label='New Admin Password'
        type='password'
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        size='small'
        fullWidth
        autoComplete='new-password'
        placeholder='Leave blank to keep current password unchanged'
        helperText='Minimum 6 characters'
      />

      {newPassword ? (
        <TextField
          label='Confirm New Admin Password'
          type='password'
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          size='small'
          fullWidth
          required
          autoComplete='new-password'
        />
      ) : null}

      <FormControlLabel
        control={
          <Switch
            checked={otpEnabled}
            onChange={e => setOtpEnabled(e.target.checked)}
            color='primary'
          />
        }
        label='Require Email OTP for Admin Login'
        className='mb-2'
      />

      <Box className='flex items-center gap-3 mt-2'>
        <Button variant='contained' type='submit' disabled={saving}>
          {saving ? <CircularProgress size={18} color='inherit' /> : 'Update Admin Credentials'}
        </Button>
        <Button variant='text' onClick={handleLock} disabled={saving}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}
