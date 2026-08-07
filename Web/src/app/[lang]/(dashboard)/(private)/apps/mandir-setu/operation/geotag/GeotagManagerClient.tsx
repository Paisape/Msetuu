'use client'

import { useState, useEffect, useMemo } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

type GeotagPhoto = {
  id: string
  userId: string
  imageUrl: string
  latitude: number | null
  longitude: number | null
  templeName: string | null
  suggestedTempleName: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  pointsAwarded: number | null
  createdAt: string
  user?: {
    name: string
    email: string
  }
}

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
}

const GeotagManagerClient = () => {
  const [photos, setPhotos] = useState<GeotagPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')

  const fetchPhotos = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/geotag?all=1')
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to fetch geo-tagged photos.')
      setPhotos(data)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActingId(id)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/geotag/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to update this tag.')

      setPhotos(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)))
      setSuccessMsg(status === 'APPROVED' ? `Approved — ${data.pointsAwarded} points awarded.` : 'Tag rejected.')
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setActingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) return
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/geotag?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to delete photo.')
      setSuccessMsg('Photo successfully removed.')
      setPhotos(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const filteredPhotos = useMemo(() => (tab === 'ALL' ? photos : photos.filter(p => p.status === tab)), [photos, tab])
  const pendingCount = useMemo(() => photos.filter(p => p.status === 'PENDING').length, [photos])

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <Typography variant='h4' className='font-bold text-textPrimary'>
            Geo-Tagged Photos Management
          </Typography>
          <Typography variant='body2' className='text-textSecondary mt-1'>
            Approve a tag to award the visitor points and place it on the public map. Reject spam/unrelated photos — no points awarded.
          </Typography>
        </div>
        <Button variant='outlined' onClick={fetchPhotos} startIcon={<i className='tabler-refresh' />}>
          Refresh
        </Button>
      </div>

      {errorMsg && (
        <Alert severity='error' className='mb-4' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity='success' className='mb-4' onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} className='mb-6'>
        <Tab label={`Pending (${pendingCount})`} value='PENDING' />
        <Tab label='Approved' value='APPROVED' />
        <Tab label='Rejected' value='REJECTED' />
        <Tab label='All' value='ALL' />
      </Tabs>

      {loading ? (
        <div className='p-12 text-center'>
          <CircularProgress size={30} />
        </div>
      ) : filteredPhotos.length === 0 ? (
        <Card className='p-8 text-center bg-slate-950 border border-slate-800 rounded-xl'>
          <i className='tabler-camera-off text-5xl text-slate-600 mb-3 block' />
          <Typography className='text-slate-400 font-semibold'>No photos in this filter</Typography>
        </Card>
      ) : (
        <Grid container spacing={6}>
          {filteredPhotos.map(photo => {
            const hasCoords = photo.latitude !== null && photo.longitude !== null

            const mapsUrl = hasCoords
              ? `https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`
              : '#'

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.id}>
                <Card className='overflow-hidden border border-slate-800 rounded-xl bg-slate-950/40 hover:shadow-lg transition-shadow h-full flex flex-col'>
                  <div className='relative h-64 bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-800'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt='User geotagged'
                      className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                    />
                    <Chip
                      size='small'
                      label={photo.status}
                      color={STATUS_COLOR[photo.status]}
                      className='absolute top-2 right-2 font-bold'
                    />
                  </div>
                  <CardContent className='flex-grow flex flex-col justify-between p-4'>
                    <div className='mb-4'>
                      <Typography className='font-bold text-base text-textPrimary mb-1 line-clamp-1'>
                        {photo.user?.name || 'Devotee / Guest'}
                      </Typography>
                      <Typography variant='caption' className='text-textSecondary block mb-2'>
                        Uploaded: {new Date(photo.createdAt).toLocaleString()}
                      </Typography>

                      <div className='flex items-center gap-2 text-sm mb-1' style={{ color: '#006241' }}>
                        <i className='tabler-building-temple' />
                        <span className='font-semibold'>{photo.templeName || 'No temple name given'}</span>
                      </div>
                      {photo.suggestedTempleName && photo.suggestedTempleName !== photo.templeName && (
                        <Typography variant='caption' className='text-textSecondary block mb-1'>
                          System suggested: {photo.suggestedTempleName}
                        </Typography>
                      )}

                      <div className='flex items-center gap-2 text-sm text-cyan-400 font-medium mb-1'>
                        <i className='tabler-map-pin' />
                        {hasCoords ? (
                          <a href={mapsUrl} target='_blank' rel='noopener noreferrer' className='hover:underline flex items-center gap-1'>
                            {photo.latitude?.toFixed(4)}, {photo.longitude?.toFixed(4)}
                            <i className='tabler-external-link text-xs' />
                          </a>
                        ) : (
                          <span className='text-textSecondary'>No GPS coordinates</span>
                        )}
                      </div>

                      {photo.status === 'APPROVED' && photo.pointsAwarded !== null && (
                        <Typography variant='caption' className='block mt-1 font-bold' style={{ color: '#006241' }}>
                          +{photo.pointsAwarded} points awarded
                        </Typography>
                      )}
                    </div>

                    <div className='flex justify-between items-center pt-2 border-t border-slate-800/60'>
                      {photo.status === 'PENDING' ? (
                        <div className='flex gap-2'>
                          <Button
                            size='small'
                            variant='contained'
                            color='success'
                            disabled={actingId === photo.id}
                            onClick={() => handleReview(photo.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            size='small'
                            variant='outlined'
                            color='error'
                            disabled={actingId === photo.id}
                            onClick={() => handleReview(photo.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Typography variant='caption' className='text-slate-500 line-clamp-1'>
                          ID: {photo.id}
                        </Typography>
                      )}
                      <Tooltip title='Delete Photo'>
                        <IconButton color='error' onClick={() => handleDelete(photo.id)} size='small' className='hover:bg-error/10'>
                          <i className='tabler-trash text-lg' />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </div>
  )
}

export default GeotagManagerClient
