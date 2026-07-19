'use client'

import { useState } from 'react'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

export type BirthDetails = {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  placeName: string
  lat: string
  lon: string
  tz: string
}

export const DEFAULT_BIRTH_DETAILS: BirthDetails = {
  date: '',
  time: '12:00',
  placeName: '',
  lat: '28.6139', // New Delhi — same default used server-side (DEFAULT_LOCATION)
  lon: '77.209',
  tz: '5.5'
}

type Props = {
  value: BirthDetails
  onChange: (value: BirthDetails) => void
  label: string
}

// Shared birth-detail input (date/time/place -> lat/lon/timezone) used across the Planet
// Positions, Dasha and Match Making panels. Lat/lon/timezone can be typed directly, or looked up
// from a place name via the geo-location endpoint (same freeastrologyapi.com key already
// configured under Config > Astrology).
const BirthDetailsForm = ({ value, onChange, label }: Props) => {
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const set = (patch: Partial<BirthDetails>) => onChange({ ...value, ...patch })

  const handleLookup = async () => {
    if (!value.placeName.trim()) {
      setLookupError('Enter a place name first.')

      return
    }

    setLookupLoading(true)
    setLookupError(null)

    try {
      const res = await fetch(`/api/astrology/geo-location?place=${encodeURIComponent(value.placeName.trim())}`)
      const data = await res.json().catch(() => null)

      if (!data?.configured) {
        setLookupError('Place lookup requires the Astrology API key to be configured (Config > Astrology).')

        return
      }

      // Response shape isn't guaranteed stable — check the likely field names defensively rather
      // than assuming one exact schema, same approach used for the Panchang widget on this page.
      const loc = data.location?.output ?? data.location ?? {}
      const lat = loc.latitude ?? loc.lat
      const lon = loc.longitude ?? loc.lon ?? loc.lng
      const tz = loc.timezone ?? loc.tz

      if (lat === undefined || lon === undefined) {
        setLookupError('Could not find coordinates for that place — enter latitude/longitude manually.')

        return
      }

      set({
        lat: String(lat),
        lon: String(lon),
        tz: tz !== undefined ? String(tz) : value.tz
      })
    } catch {
      setLookupError('Place lookup failed — enter latitude/longitude manually.')
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <Typography variant='subtitle2' className='font-bold' style={{ color: '#047857' }}>
        {label}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Date of Birth'
            InputLabelProps={{ shrink: true }}
            value={value.date}
            onChange={e => set({ date: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            size='small'
            type='time'
            label='Time of Birth'
            InputLabelProps={{ shrink: true }}
            value={value.time}
            onChange={e => set({ time: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <div className='flex items-center gap-2'>
            <TextField
              fullWidth
              size='small'
              label='Birth Place (city name)'
              value={value.placeName}
              onChange={e => set({ placeName: e.target.value })}
            />
            <Button variant='outlined' size='small' onClick={handleLookup} disabled={lookupLoading} className='whitespace-nowrap'>
              {lookupLoading ? <CircularProgress size={16} /> : 'Look up'}
            </Button>
          </div>
          {lookupError && (
            <Typography variant='caption' style={{ color: '#dc2626' }}>
              {lookupError}
            </Typography>
          )}
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField fullWidth size='small' type='number' label='Latitude' value={value.lat} onChange={e => set({ lat: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField fullWidth size='small' type='number' label='Longitude' value={value.lon} onChange={e => set({ lon: e.target.value })} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField fullWidth size='small' type='number' label='Timezone' value={value.tz} onChange={e => set({ tz: e.target.value })} />
        </Grid>
      </Grid>
    </div>
  )
}

export default BirthDetailsForm
