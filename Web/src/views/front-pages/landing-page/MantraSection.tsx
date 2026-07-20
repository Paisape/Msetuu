'use client'

import { useMantra } from '@/contexts/MantraContext'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

import classnames from 'classnames'

import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

const MantraSection = () => {
  const {
    tracks,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    playTrack,
    seek,
    loading
  } = useMantra()

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      seek(newValue)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  if (loading && tracks.length === 0) {
    return (
      <section id='mantras' className='py-16 px-6 max-w-7xl mx-auto text-center'>
        <CircularProgress size={32} color='success' />
      </section>
    )
  }

  if (tracks.length === 0) {
    return null // Hide section if no mantras exist in DB
  }

  return (
    <section id='mantras' className='py-16 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-12 flex flex-col items-center gap-2'>
        <Chip
          size='small'
          variant='tonal'
          label='Divine Chants'
          style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#006241', fontWeight: 'bold' }}
        />
        <Typography
          variant='h2'
          className='font-bold mb-4 galaxy-glow-text'
          style={{ color: '#006241', fontFamily: 'Cinzel, Georgia, serif' }}
        >
          Sacred Mantra Chants
        </Typography>
        <Typography variant='body1' style={{ color: '#4b5563' }} className='max-w-2xl mx-auto'>
          Immerse yourself in divine vibrations. Listen to authentic Vedic mantra recitations to bring peace, prosperity, and positive energy to your day.
        </Typography>
      </div>

      <Grid container spacing={6} className='justify-center'>
        {tracks.map((track, index) => {
          const isActive = currentTrackIndex === index
          const isCurrentPlaying = isActive && isPlaying

          return (
            <Grid size={{ xs: 12, md: 6 }} key={track.id}>
              <Card 
                className={classnames(
                  'galaxy-card border transition-all duration-300 rounded-2xl relative overflow-hidden',
                  isActive ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg bg-emerald-50/10' : 'border-slate-200/60 bg-white'
                )}
              >
                {/* Visual playing indicator background wave */}
                {isCurrentPlaying && (
                  <div className='absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20 overflow-hidden'>
                    <div className='h-full bg-emerald-500 animate-pulse' style={{ width: `${(currentTime / duration) * 100}%` }} />
                  </div>
                )}

                <CardContent className='p-6 flex flex-col gap-4'>
                  <div className='flex gap-4 items-center justify-between'>
                    <div className='flex gap-4 items-center'>
                      {/* Play/Pause Button */}
                      <IconButton 
                        onClick={() => playTrack(index)}
                        className={classnames(
                          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md',
                          isCurrentPlaying ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        )}
                      >
                        <i className={classnames(isCurrentPlaying ? 'tabler-pause-filled text-2xl' : 'tabler-play-filled text-2xl')} />
                      </IconButton>

                      <div className='text-left'>
                        <Typography variant='h5' className='font-bold text-slate-800 flex items-center gap-2'>
                          {track.title}
                          {isCurrentPlaying && (
                            <div className='flex items-end gap-0.5 h-4 mb-1'>
                              <div className='w-0.5 bg-emerald-500 animate-[wave_1.2s_ease-in-out_infinite]' style={{ height: '60%' }} />
                              <div className='w-0.5 bg-emerald-500 animate-[wave_0.8s_ease-in-out_infinite]' style={{ height: '100%' }} />
                              <div className='w-0.5 bg-emerald-500 animate-[wave_1.0s_ease-in-out_infinite]' style={{ height: '40%' }} />
                            </div>
                          )}
                        </Typography>
                        <Typography variant='caption' className='text-emerald-600 font-bold block mbe-1'>
                          Deity: {track.deity}
                        </Typography>
                      </div>
                    </div>

                    <Chip 
                      label={track.duration} 
                      size='small' 
                      variant='tonal'
                      style={{ color: '#475569', fontWeight: 'semibold', background: 'rgba(148, 163, 184, 0.12)' }}
                    />
                  </div>

                  <Typography variant='body2' className='text-slate-600 text-left min-h-[40px]'>
                    {track.subtitle}
                  </Typography>

                  {/* Audio Controls for current active track */}
                  {isActive && (
                    <Box className='mt-2 flex items-center gap-4 w-full'>
                      <Typography className='text-xs text-slate-500 font-semibold w-10'>
                        {formatTime(currentTime)}
                      </Typography>
                      <Slider
                        size='small'
                        value={currentTime}
                        min={0}
                        max={duration || 100}
                        onChange={handleSliderChange}
                        sx={{
                          color: '#10b981',
                          '& .MuiSlider-thumb': {
                            width: 8,
                            height: 8,
                            transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                            '&:before': { boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)' },
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: `0px 0px 0px 8px rgb(16 185 129 / 16%)`
                            }
                          },
                          '& .MuiSlider-rail': { opacity: 0.28 }
                        }}
                        className='flex-1'
                      />
                      <Typography className='text-xs text-slate-500 font-semibold w-10 text-right'>
                        {formatTime(duration)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Styled animation keyframes for waveform */}
      <style jsx global>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1.1); }
        }
      `}</style>
    </section>
  )
}

export default MantraSection
