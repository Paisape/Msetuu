'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

type GeotagPhoto = {
  id: string
  userId: string
  imageUrl: string
  latitude: number | null
  longitude: number | null
  createdAt: string
  user?: {
    name: string
    email: string
  }
}

const GeotagManagerClient = () => {
  const [photos, setPhotos] = useState<GeotagPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

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

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <Typography variant='h4' className='font-bold text-textPrimary'>
            Geo-Tagged Photos Management
          </Typography>
          <Typography variant='body2' className='text-textSecondary mt-1'>
            Moderate customer spiritual selfies and geo-tagged visits.
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

      {loading ? (
        <div className='p-12 text-center'>
          <CircularProgress size={30} />
        </div>
      ) : photos.length === 0 ? (
        <Card className='p-8 text-center bg-slate-950 border border-slate-800 rounded-xl'>
          <i className='tabler-camera-off text-5xl text-slate-600 mb-3 block' />
          <Typography className='text-slate-400 font-semibold'>
            No Geo-Tagged Photos Yet
          </Typography>
          <Typography className='text-slate-500 text-sm mt-1'>
            Photos uploaded by users will show up here for admin moderation.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={6}>
          {photos.map(photo => {
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
                  </div>
                  <CardContent className='flex-grow flex flex-col justify-between p-4'>
                    <div className='mb-4'>
                      <Typography className='font-bold text-base text-textPrimary mb-1 line-clamp-1'>
                        {photo.user?.name || 'Devotee / Guest'}
                      </Typography>
                      <Typography variant='caption' className='text-textSecondary block mb-3'>
                        Uploaded: {new Date(photo.createdAt).toLocaleString()}
                      </Typography>

                      <div className='flex items-center gap-2 text-sm text-cyan-400 font-medium mb-1'>
                        <i className='tabler-map-pin' />
                        {hasCoords ? (
                          <a
                            href={mapsUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='hover:underline flex items-center gap-1'
                          >
                            {photo.latitude?.toFixed(4)}, {photo.longitude?.toFixed(4)}
                            <i className='tabler-external-link text-xs' />
                          </a>
                        ) : (
                          <span className='text-textSecondary'>No GPS coordinates</span>
                        )}
                      </div>
                    </div>

                    <div className='flex justify-between items-center pt-2 border-t border-slate-800/60'>
                      <Typography variant='caption' className='text-slate-500 line-clamp-1 max-w-[150px]'>
                        ID: {photo.id}
                      </Typography>
                      <Tooltip title='Delete Photo'>
                        <IconButton
                          color='error'
                          onClick={() => handleDelete(photo.id)}
                          size='small'
                          className='hover:bg-error/10'
                        >
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
