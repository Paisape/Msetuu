'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import PageBanner from '@/components/PageBanner'

type VrMediaItem = {
  id: string
  slug: string
  title: string
  description: string | null
  mediaType: string
  mediaUrl: string
  thumbnailUrl: string | null
  viewsCount: number
  active: boolean
}

export default function Darshan3DPage() {
  const [items, setItems] = useState<VrMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<VrMediaItem | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }

    fetch('/api/vr')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Only show active items
          setItems(data.filter((item: VrMediaItem) => item.active))
        }
      })
      .catch(err => {
        console.error('Failed to load 3D Darshan tours:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleOpenQr = (item: VrMediaItem) => {
    setSelectedItem(item)
    setCopiedLink(false)
    setOpenModal(true)
  }

  const handleCopyLink = () => {
    if (!selectedItem) return
    const url = `${origin}/front-pages/vr/${selectedItem.slug}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const is3dTour = (item: VrMediaItem) => {
    return (
      item.mediaUrl.endsWith('.htm') ||
      item.mediaUrl.endsWith('.html') ||
      item.mediaUrl.includes('/tours/') ||
      item.mediaType === 'VR_360_IMAGE'
    )
  }

  const getMediaBadge = (item: VrMediaItem) => {
    if (item.mediaUrl.endsWith('.htm') || item.mediaUrl.endsWith('.html') || item.mediaUrl.includes('/tours/')) {
      return {
        label: '3D VIRTUAL TOUR',
        icon: '🏛️',
        bg: 'from-amber-500 to-orange-600',
        textColor: 'text-amber-300'
      }
    }
    if (item.mediaType === 'VR_360_VIDEO') {
      return {
        label: '360° VR VIDEO',
        icon: '🎥',
        bg: 'from-blue-600 to-cyan-600',
        textColor: 'text-cyan-300'
      }
    }
    return {
      label: '360° PANORAMA',
      icon: '🌐',
      bg: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-300'
    }
  }

  const selectedUrl = selectedItem ? `${origin}/front-pages/vr/${selectedItem.slug}` : ''
  const selectedQrUrl = selectedUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedUrl)}`
    : ''

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-4 sm:px-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Page Banner */}
        <PageBanner
          page='darshan'
          variant='dark'
          titleColor='#22d3ee'
          defaultTitle='3D Darshan & VR Virtual Experience'
          defaultSubtitle='Immerse yourself in authentic 360° sacred sanctum tours, architectural Darshan, and sacred parikramas on your mobile phone, VR headset, or browser.'
        />

        {loading ? (
          <div className='flex justify-center py-24'>
            <CircularProgress style={{ color: '#22d3ee' }} />
          </div>
        ) : items.length === 0 ? (
          <div className='galaxy-card text-center text-slate-300 py-16 px-6 max-w-xl mx-auto rounded-2xl border border-cyan-500/20'>
            <div className='text-5xl mb-4'>🥽</div>
            <Typography variant='h5' className='font-bold text-white mb-2'>
              No 3D Virtual Tours Available Yet
            </Typography>
            <Typography variant='body2' className='text-slate-400'>
              Temple 3D Darshan tours and 360° VR packages will appear here once published from the management portal.
            </Typography>
          </div>
        ) : (
          <Grid container spacing={4}>
            {items.map(item => {
              const badge = getMediaBadge(item)
              const thumbUrl = item.thumbnailUrl || '/images/vr-placeholder.jpg'

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                  <Card className='galaxy-card h-full flex flex-col justify-between overflow-hidden relative border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 group rounded-2xl bg-slate-900/80 backdrop-blur-md'>
                    <div>
                      {/* Thumbnail Container */}
                      <div className='relative overflow-hidden aspect-video bg-slate-950'>
                        {item.thumbnailUrl ? (
                          <img
                            src={thumbUrl}
                            alt={item.title}
                            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                            onError={e => {
                              // Fallback if image fails to load
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className='w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-cyan-400'>
                            <i className='tabler-rotate-3d text-5xl mb-2 opacity-80' />
                            <span className='text-xs font-semibold tracking-wider text-slate-400'>3D VIRTUAL TOUR</span>
                          </div>
                        )}

                        {/* Top Badge */}
                        <div className={`absolute top-3 left-3 bg-gradient-to-r ${badge.bg} text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </div>

                        {/* Views Count Pill */}
                        <div className='absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-slate-200 text-xs px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1'>
                          <i className='tabler-eye text-cyan-400' />
                          <span>{item.viewsCount} views</span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <CardContent className='p-5'>
                        <Typography variant='h6' className='font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition-colors'>
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography variant='body2' className='text-slate-300 text-sm line-clamp-2 leading-relaxed mb-1'>
                            {item.description}
                          </Typography>
                        )}
                      </CardContent>
                    </div>

                    {/* Action Buttons */}
                    <div className='p-5 pt-0 mt-auto border-t border-cyan-500/10 flex items-center gap-2 justify-between'>
                      <Button
                        size='small'
                        variant='outlined'
                        className='border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-bold'
                        startIcon={<i className='tabler-qrcode' />}
                        onClick={() => handleOpenQr(item)}
                      >
                        QR Code
                      </Button>

                      <Button
                        component={Link}
                        href={`/front-pages/vr/${item.slug}`}
                        variant='contained'
                        className='galaxy-glow-btn text-xs font-extrabold px-4 flex-grow text-center'
                        style={{ background: 'linear-gradient(135deg, #FF671F 0%, #EA580C 100%)', color: '#fff' }}
                        startIcon={<i className='tabler-rotate-3d' />}
                      >
                        Experience 3D
                      </Button>
                    </div>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        {/* Modal showing QR code + Mobile & Web Experience details */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            className: 'bg-slate-900 text-white p-2 rounded-2xl border border-cyan-500/30 shadow-2xl'
          }}
        >
          <DialogTitle className='font-bold text-lg text-white border-b border-cyan-500/20 pb-3 flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <span className='text-xl'>🥽</span>
              <span className='text-cyan-300'>{selectedItem?.title}</span>
            </div>
            <Button size='small' onClick={() => setOpenModal(false)} className='text-slate-400 hover:text-white'>
              ✕
            </Button>
          </DialogTitle>

          <DialogContent className='py-6 flex flex-col items-center text-center gap-4'>
            <div className='bg-white p-3 rounded-2xl shadow-xl border-4 border-cyan-500/30'>
              {selectedQrUrl && (
                <img src={selectedQrUrl} alt='QR Code' className='w-48 h-48 rounded-lg' />
              )}
            </div>

            <div>
              <Typography variant='subtitle1' className='font-bold text-white mb-1'>
                Scan with Mobile Camera / Google Lens
              </Typography>
              <Typography variant='caption' className='text-slate-400 block max-w-sm'>
                Open camera app on your phone, point to this QR code, and instantly enter the interactive 3D temple sanctum!
              </Typography>
            </div>

            {/* Direct Shareable Link Box */}
            <Box className='w-full bg-slate-950/80 border border-cyan-500/20 rounded-xl p-3 flex items-center justify-between gap-2 text-left'>
              <div className='min-w-0 flex-grow'>
                <Typography variant='caption' className='text-slate-400 uppercase text-[10px] font-bold block'>
                  Direct Tour URL
                </Typography>
                <Typography variant='body2' className='text-cyan-300 text-xs font-mono truncate'>
                  {selectedUrl}
                </Typography>
              </div>
              <Button
                size='small'
                variant='contained'
                onClick={handleCopyLink}
                className='text-xs font-bold shrink-0'
                style={{ backgroundColor: copiedLink ? '#10B981' : '#0891B2', color: '#fff' }}
              >
                {copiedLink ? 'Copied! ✓' : 'Copy Link'}
              </Button>
            </Box>
          </DialogContent>

          <DialogActions className='border-t border-cyan-500/20 px-4 py-3 flex justify-between'>
            <Button onClick={() => setOpenModal(false)} className='text-slate-400'>
              Close
            </Button>
            {selectedItem && (
              <Button
                component='a'
                href={`/front-pages/vr/${selectedItem.slug}`}
                target='_blank'
                rel='noopener noreferrer'
                variant='contained'
                className='font-bold text-xs'
                style={{ background: 'linear-gradient(135deg, #FF671F 0%, #EA580C 100%)', color: '#fff' }}
                startIcon={<i className='tabler-external-link' />}
              >
                Open 3D Tour ↗
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </div>
    </div>
  )
}
