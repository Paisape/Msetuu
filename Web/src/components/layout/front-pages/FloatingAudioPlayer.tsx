'use client'

import { useMantra } from '@/contexts/MantraContext'
import { Card, CardContent, Typography, IconButton, Slider, Box, Slide } from '@mui/material'

const FloatingAudioPlayer = () => {
  const {
    tracks,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek
  } = useMantra()

  if (currentTrackIndex === null) return null

  const track = tracks[currentTrackIndex]
  if (!track) return null

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

  return (
    <Slide direction='up' in={currentTrackIndex !== null} mountOnEnter unmountOnExit>
      <Card
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: { xs: 'calc(100% - 48px)', sm: 360 },
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.1)'
        }}
      >
        <CardContent sx={{ p: '16px !important' }} className='flex flex-col gap-2'>
          <Box className='flex items-center justify-between gap-3'>
            <Box className='flex items-center gap-3 overflow-hidden'>
              {/* Play/Pause icon */}
              <IconButton
                onClick={togglePlay}
                size='medium'
                sx={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#059669' },
                  width: 40,
                  height: 40
                }}
              >
                <i className={isPlaying ? 'tabler-pause' : 'tabler-play'} style={{ fontSize: '18px' }} />
              </IconButton>

              <Box className='text-left overflow-hidden'>
                <Typography variant='subtitle2' className='font-bold text-slate-800 truncate block'>
                  {track.title}
                </Typography>
                <Typography variant='caption' className='text-emerald-600 font-semibold block truncate'>
                  {track.deity}
                </Typography>
              </Box>
            </Box>

            {/* Small waveform animation */}
            {isPlaying && (
              <Box className='flex items-end gap-0.5 h-4 mb-1 mr-2'>
                <div className='w-0.5 bg-emerald-500 animate-[wave_1.2s_ease-in-out_infinite]' style={{ height: '60%' }} />
                <div className='w-0.5 bg-emerald-500 animate-[wave_0.8s_ease-in-out_infinite]' style={{ height: '100%' }} />
                <div className='w-0.5 bg-emerald-500 animate-[wave_1.0s_ease-in-out_infinite]' style={{ height: '40%' }} />
              </Box>
            )}
          </Box>

          {/* Progress Slider */}
          <Box className='flex items-center gap-3 w-full mt-1'>
            <Typography className='text-[10px] text-slate-500 font-semibold w-8 text-left'>
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
                padding: '4px 0',
                '& .MuiSlider-thumb': {
                  width: 8,
                  height: 8,
                  '&:before': { boxShadow: 'none' }
                },
                '& .MuiSlider-rail': { opacity: 0.28 }
              }}
              className='flex-1'
            />
            <Typography className='text-[10px] text-slate-500 font-semibold w-8 text-right'>
              {formatTime(duration)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Slide>
  )
}

export default FloatingAudioPlayer
