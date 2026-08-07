'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'

import IndiaMap from './IndiaMap'
import type { MapPin } from './IndiaMap'

type GeoTagPin = MapPin & { createdAt: string }

const MapSection = () => {
  const [pins, setPins] = useState<GeoTagPin[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<GeoTagPin | null>(null)

  useEffect(() => {
    fetch('/api/geotag?public=1')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return

        setPins(
          data.map((tag: any) => ({
            id: tag.id,
            latitude: tag.latitude,
            longitude: tag.longitude,
            label: tag.templeName,
            imageUrl: tag.imageUrl,
            createdAt: tag.createdAt
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center py-16'>
        <CircularProgress style={{ color: '#006241' }} />
      </div>
    )
  }

  return (
    <div>
      <Typography className='text-center mb-6' style={{ color: '#6b7280' }}>
        {pins.length > 0
          ? `${pins.length} approved temple visit${pins.length === 1 ? '' : 's'} tagged by our community.`
          : 'No approved tags yet — be the first to tag a temple visit!'}
      </Typography>

      <Card className='p-4 md:p-8 border border-slate-200/60 max-w-2xl mx-auto'>
        <IndiaMap pins={pins} onPinClick={pin => setSelected(pin as GeoTagPin)} />
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth='xs' fullWidth>
        <DialogContent className='p-0'>
          {selected && (
            <div>
              {selected.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.imageUrl} alt={selected.label || 'Temple visit'} className='w-full h-56 object-cover' />
              )}
              <div className='p-4'>
                <Typography className='font-bold' style={{ color: '#006241' }}>
                  {selected.label || 'Temple visit'}
                </Typography>
                <Typography variant='caption' style={{ color: '#6b7280' }}>
                  {new Date(selected.createdAt).toLocaleDateString()}
                </Typography>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MapSection
