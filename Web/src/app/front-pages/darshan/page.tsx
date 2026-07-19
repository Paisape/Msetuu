'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import CircularProgress from '@mui/material/CircularProgress'

import PageBanner from '@/components/PageBanner'

type Temple = {
  id: string
  name: string
  location: string | null
  description: string | null
  image: string
  qrCodeUrl: string
  model3dUrl: string
}

const DarshanPage = () => {
  const [temples, setTemples] = useState<Temple[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null)

  useEffect(() => {
    fetch('/api/darshan')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemples(data)
      })
      .catch(() => {
        // Keep the empty state on error — no fake data
      })
      .finally(() => setLoading(false))
  }, [])

  const handleOpen = (item: Temple) => {
    setSelectedTemple(item)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Banner */}
        <PageBanner
          page='darshan'
          variant='dark'
          defaultTitle='Darshan Experience Center'
          defaultSubtitle='Scan the QR codes of our holy temples to load the immersive 3D Darshan models on your mobile phone, or open the experience directly here.'
        />

        {loading ? (
          <div className='flex justify-center py-16'>
            <CircularProgress />
          </div>
        ) : temples.length === 0 ? (
          <Typography className='text-center text-slate-400 py-16'>
            No Darshan temples have been added yet — check back soon.
          </Typography>
        ) : (
          <Grid container spacing={8}>
            {temples.map(t => (
              <Grid size={{ xs: 12, md: 4 }} key={t.id}>
                <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden relative'>
                  <div>
                    <div className='relative h-60 w-full overflow-hidden'>
                      <img src={t.image} alt={t.name} className='w-full h-full object-cover transition-transform duration-500 hover:scale-105' />
                      {t.location && (
                        <div className='absolute top-4 left-4 bg-cyan-900/80 backdrop-blur-sm text-cyan-200 text-xs px-3 py-1.5 rounded-full border border-cyan-500/20'>
                          📍 {t.location}
                        </div>
                      )}
                    </div>
                    <CardContent className='p-6'>
                      <Typography variant='h5' className='font-bold text-white mb-3'>
                        {t.name}
                      </Typography>
                      {t.description && (
                        <Typography variant='body2' className='text-slate-300 mb-4 leading-relaxed'>
                          {t.description}
                        </Typography>
                      )}
                    </CardContent>
                  </div>
                  <CardContent className='p-6 pt-0 mt-auto border-t border-cyan-500/10 flex justify-between items-center'>
                    <span className='text-xs text-cyan-400 font-bold'>Scan for 3D Experience</span>
                    <Button
                      onClick={() => handleOpen(t)}
                      className='galaxy-glow-btn font-bold px-6'
                    >
                      View QR & 3D
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modal showing QR code + link to the real 3D/AR experience */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth='md'
          fullWidth
          PaperProps={{
            className: 'galaxy-card text-white p-6 border border-cyan-500/30'
          }}
        >
          <DialogTitle className='font-bold text-xl text-white galaxy-glow-text border-b border-cyan-500/10 pb-4 flex justify-between items-center'>
            <span>{selectedTemple?.name} - Immersive Darshan</span>
            <Button onClick={handleClose} className='text-slate-400 hover:text-white font-bold'>
              Close
            </Button>
          </DialogTitle>

          <DialogContent className='py-6'>
            <Grid container spacing={6} alignItems='center'>
              <Grid size={{ xs: 12, md: 5 }} className='flex flex-col items-center justify-center text-center'>
                <div className='bg-white p-4 rounded-xl border border-cyan-500/20 mb-4 shadow-xl'>
                  <img src={selectedTemple?.qrCodeUrl} alt='QR Code' className='w-48 h-48' />
                </div>
                <Typography className='text-slate-300 text-sm font-semibold mb-2'>
                  Scan with your mobile camera
                </Typography>
                <Typography className='text-slate-400 text-xs px-4'>
                  Instantly open the 3D model with AR capabilities directly on your Android or iOS device!
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <div className='relative w-full h-80 rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950 flex flex-col justify-center items-center text-center p-6'>
                  <i className='tabler-rotate-3d text-5xl text-cyan-400 mb-4' />
                  <Typography variant='h6' className='text-white font-bold mb-2'>
                    Web Interactive 3D Model
                  </Typography>
                  <Typography className='text-slate-400 text-sm max-w-sm mb-6'>
                    Explore the architectural rendering of the temple in a new tab.
                  </Typography>
                  <Button
                    component='a'
                    href={selectedTemple?.model3dUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='galaxy-glow-btn font-bold px-8'
                  >
                    Open 3D Experience
                  </Button>
                </div>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default DarshanPage
