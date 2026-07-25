'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

const GeotagSettingsClient = () => {
  const [pointsPerTag, setPointsPerTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/geotag/settings')
      .then(res => res.json())
      .then(data => setPointsPerTag(String(data.pointsPerTag)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/geotag/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsPerTag: Number(pointsPerTag) })
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to save.')
      setMessage({ type: 'success', text: 'Saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-12 text-center'>
        <CircularProgress size={24} />
      </div>
    )
  }

  return (
    <Card className='p-6 max-w-md'>
      <Typography variant='h6' className='font-bold mb-1'>
        Points Per Approved Tag
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-4'>
        How many points a visitor earns each time you approve one of their temple tags. Changing this only affects tags approved from now on — already-approved tags keep the point value they were awarded at the time.
      </Typography>

      {message && (
        <Alert severity={message.type} className='mb-4' onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className='flex gap-3 items-start'>
        <TextField
          type='number'
          label='Points'
          value={pointsPerTag}
          onChange={e => setPointsPerTag(e.target.value)}
          size='small'
          inputProps={{ min: 0 }}
        />
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </div>
    </Card>
  )
}

export default GeotagSettingsClient
