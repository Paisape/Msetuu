'use client'

import { useState, useEffect, useCallback } from 'react'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

export default function AdminCredentialsPanel() {
  const [loading, setLoading] = useState(true)
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-credentials')
      const data = await res.json()
      if (res.ok && data.email) {
        setCurrentEmail(data.email)
        setNewEmail(data.email)
      } else {
        setError(data?.error || 'Failed to load admin profile.')
      }
    } catch {
      setError('Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword) {
      setError('Please enter your current password to authorize changes.')
      return
    }

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
          newPassword: newPassword.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update credentials.')
      }

      setSuccess(data.message || 'Credentials updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (data.newEmail) {
        setCurrentEmail(data.newEmail)
        setNewEmail(data.newEmail)
      }
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

  return (
    <Box component='form' onSubmit={handleSubmit} className='flex flex-col gap-5' style={{ maxWidth: 500 }}>
      <Typography variant='body2' color='textSecondary'>
        Update your Admin Email Address and Admin Password below. Current password verification is required for security.
      </Typography>

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

      <TextField
        label='Current Admin Email'
        value={currentEmail}
        disabled
        size='small'
        fullWidth
        helperText='Current active email registered in system'
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

      <TextField
        label='Current Admin Password (Required to Save)'
        type='password'
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        size='small'
        fullWidth
        required
        autoComplete='current-password'
        helperText='Verify your current password to authorize updates'
      />

      <Box className='flex items-center gap-3 mt-2'>
        <Button variant='contained' type='submit' disabled={saving}>
          {saving ? <CircularProgress size={18} color='inherit' /> : 'Update Admin Credentials'}
        </Button>
      </Box>
    </Box>
  )
}
