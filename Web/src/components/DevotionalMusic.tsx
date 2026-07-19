'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Tooltip from '@mui/material/Tooltip'

// ── Real devotional mantra tracks (publicly accessible CORS-friendly sources) ──
const MANTRAS = [
  {
    id: 1,
    name: 'Om Namah Shivaya',
    deity: 'Lord Shiva 🕉️',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Om_namah_shivaya.ogg'
  },
  {
    id: 2,
    name: 'Om Chanting 108 Times',
    deity: 'Universal 🙏',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Om.ogg'
  },
  {
    id: 3,
    name: 'Gayatri Mantra',
    deity: 'Surya Deva 🌞',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Gayatri_mantra.ogg'
  },
  {
    id: 4,
    name: 'Shanti Mantra',
    deity: 'Peace 🌿',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Shanti_mantra.ogg'
  },
  {
    id: 5,
    name: 'Mahamrityunjaya Mantra',
    deity: 'Lord Shiva 🔱',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Mahamrityunjaya_mantra.ogg'
  }
]

// ── Synthesise a realistic bronze temple bell (ghanta) using Web Audio API ──────────────────
// Real bells ring with a stack of *inharmonic* partials (not clean integer multiples of the
// fundamental like a flute) — that's what gives a bell its metallic, shimmering "clang" instead
// of a flat beep. This uses the classic Risset-bell approach: several sine partials at
// non-integer frequency ratios, each with its own amplitude and decay time, plus a touch of
// detuning between two oscillators per partial for a natural chorus/beating shimmer.
// 100% synthesised (no network fetch), so it's always instant and reliable on every click.
const BELL_PARTIALS = [
  { ratio: 1, gain: 1, decay: 2.6 },
  { ratio: 1.99, gain: 0.55, decay: 2.2 },
  { ratio: 2.43, gain: 0.35, decay: 1.8 },
  { ratio: 3.76, gain: 0.22, decay: 1.4 },
  { ratio: 4.11, gain: 0.16, decay: 1.1 },
  { ratio: 5.43, gain: 0.1, decay: 0.7 },
  { ratio: 6.8, gain: 0.06, decay: 0.5 }
]

function playTemplateBell(volumeLevel = 0.5) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext

    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const fundamental = 220 // deep bronze strike (~A3), closer to a real mandir ghanta

    // Soft-clipping master bus so the stacked partials never crackle at higher volumes.
    const master = ctx.createGain()

    master.gain.setValueAtTime(volumeLevel, now)
    master.connect(ctx.destination)

    BELL_PARTIALS.forEach(({ ratio, gain, decay }, i) => {
      const freq = fundamental * ratio

      // A hint of inharmonic detune between two paired oscillators gives the characteristic
      // slow "beating" shimmer real bronze bells have as their partials slowly drift out of phase.
      const detunes = [-3, 3]

      detunes.forEach(cents => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        osc.detune.setValueAtTime(cents, now)

        // Fast, soft attack (bells are struck, not bowed) then a natural exponential decay —
        // higher partials fade faster than the fundamental, matching real bell physics.
        const peak = (gain / detunes.length) * (1 - i * 0.03)

        gainNode.gain.setValueAtTime(0.0001, now)
        gainNode.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), now + 0.012)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay)

        osc.connect(gainNode)
        gainNode.connect(master)
        osc.start(now)
        osc.stop(now + decay + 0.1)
      })
    })

    // Auto-close the context once the longest partial has fully decayed, to avoid leaking
    // AudioContext instances on rapid repeated clicks.
    const longest = Math.max(...BELL_PARTIALS.map(p => p.decay))

    setTimeout(() => ctx.close().catch(() => {}), (longest + 0.3) * 1000)
  } catch (_) {}
}

export default function DevotionalMusic() {
  const [isOpen, setIsOpen]           = useState(true)   // start EXPANDED
  const [isPlaying, setIsPlaying]     = useState(false)
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [volume, setVolume]           = useState(0.7)
  const [progress, setProgress]       = useState(0)
  const [duration, setDuration]       = useState(0)
  const [errorMsg, setErrorMsg]       = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const track = MANTRAS[currentIdx]

  // ── Clean up interval helper ──────────────────────────────────────────────
  const clearProgress = () => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
  }

  // ── Build/replace audio element whenever track changes ────────────────────
  useEffect(() => {
    clearProgress()
    setProgress(0)
    setDuration(0)
    setErrorMsg('')

    const audio = new Audio(track.url)

    audio.volume = volume
    audio.preload = 'metadata'
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))

    audio.addEventListener('ended', () => {
      // Auto-advance to next track
      setCurrentIdx(prev => (prev + 1) % MANTRAS.length)
    })

    audio.addEventListener('error', () => {
      setErrorMsg('Track unavailable — skipping...')
      setIsPlaying(false)
      setTimeout(() => {
        setErrorMsg('')
        setCurrentIdx(prev => (prev + 1) % MANTRAS.length)
      }, 1500)
    })

    // If already playing, start new track immediately
    if (isPlaying) {
      audio.play()
        .then(() => {
          progressRef.current = setInterval(() => {
            setProgress(audio.currentTime)
          }, 500)
        })
        .catch(() => setIsPlaying(false))
    }

    return () => {
      audio.pause()
      audio.src = ''
      clearProgress()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx])

  // ── Volume sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // ── Play / Pause toggle ───────────────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current

    if (!audio) return

    if (isPlaying) {
      audio.pause()
      clearProgress()
      setIsPlaying(false)
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true)
          progressRef.current = setInterval(() => setProgress(audio.currentTime), 500)
        })
        .catch(() => {
          setErrorMsg('Tap play to start chanting 🙏')
          setIsPlaying(false)
        })
    }
  }

  // ── Skip controls ─────────────────────────────────────────────────────────
  const skipNext = () => {
    clearProgress()
    setCurrentIdx(prev => (prev + 1) % MANTRAS.length)
  }

  const skipPrev = () => {
    clearProgress()
    setCurrentIdx(prev => (prev - 1 + MANTRAS.length) % MANTRAS.length)
  }

  // ── Global click bell ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement

      if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.closest('button') || t.closest('a')) {
        playTemplateBell(0.4)
      }
    }

    window.addEventListener('click', handleClick)
    
return () => window.removeEventListener('click', handleClick)
  }, [])

  // ── Format seconds → mm:ss ────────────────────────────────────────────────
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)

    
return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        borderRadius: isOpen ? '20px' : '50px',
        background: 'rgba(255,255,255,0.98)',
        border: '2px solid rgba(16,185,129,0.35)',
        boxShadow: '0 8px 40px rgba(16,185,129,0.2), 0 2px 12px rgba(0,0,0,0.08)',
        width: isOpen ? '270px' : '56px',
        overflow: 'hidden',
      }}
    >
      {/* ── Collapsed pill ── */}
      {!isOpen && (
        <Tooltip title='Open Devotional Music Player' placement='right'>
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{ width: 56, height: 56, borderRadius: '50px' }}
          >
            <span
              style={{
                fontSize: '24px',
                display: 'inline-block',
                animation: isPlaying ? 'om-spin 6s linear infinite' : 'none'
              }}
            >
              🕉️
            </span>
          </IconButton>
        </Tooltip>
      )}

      {/* ── Expanded player ── */}
      {isOpen && (
        <Box sx={{ p: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Header row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', animation: isPlaying ? 'om-spin 6s linear infinite' : 'none', display: 'inline-block' }}>🕉️</span>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#059669', letterSpacing: '0.3px' }}>
                Devotional Chants
              </Typography>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} size='small' sx={{ color: '#94a3b8', p: '2px' }}>
              <i className='tabler-minus text-sm' />
            </IconButton>
          </Box>

          {/* Track info */}
          <Box sx={{ textAlign: 'center', py: '4px' }}>
            <Typography sx={{ fontSize: '10px', color: '#10b981', fontWeight: 700, mb: '2px' }}>
              {track.deity}
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
              {track.name}
            </Typography>
            {errorMsg && (
              <Typography sx={{ fontSize: '10px', color: '#ef4444', mt: '4px' }}>
                {errorMsg}
              </Typography>
            )}
          </Box>

          {/* Progress bar */}
          <Box>
            <Box sx={{ height: '4px', background: 'rgba(16,185,129,0.12)', borderRadius: '4px', overflow: 'hidden', mb: '4px' }}>
              <Box sx={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg,#10b981,#34d399)',
                borderRadius: '4px',
                transition: 'width 0.5s linear'
              }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '9px', color: '#94a3b8' }}>{fmt(progress)}</Typography>
              <Typography sx={{ fontSize: '9px', color: '#94a3b8' }}>{duration > 0 ? fmt(duration) : '--:--'}</Typography>
            </Box>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <IconButton
              onClick={skipPrev}
              size='small'
              sx={{ color: '#059669', bgcolor: 'rgba(16,185,129,0.08)', '&:hover': { bgcolor: 'rgba(16,185,129,0.16)' }, width: 32, height: 32 }}
            >
              <i className='tabler-player-skip-back text-xs' />
            </IconButton>

            <IconButton
              onClick={togglePlay}
              sx={{
                width: 44, height: 44,
                color: 'white',
                background: 'linear-gradient(135deg,#10b981,#34d399)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                '&:hover': { background: 'linear-gradient(135deg,#059669,#10b981)', transform: 'scale(1.06)' },
                transition: 'all 0.2s ease'
              }}
            >
              <i className={isPlaying ? 'tabler-player-pause' : 'tabler-player-play'} style={{ fontSize: '18px' }} />
            </IconButton>

            <IconButton
              onClick={skipNext}
              size='small'
              sx={{ color: '#059669', bgcolor: 'rgba(16,185,129,0.08)', '&:hover': { bgcolor: 'rgba(16,185,129,0.16)' }, width: 32, height: 32 }}
            >
              <i className='tabler-player-skip-forward text-xs' />
            </IconButton>
          </Box>

          {/* Volume */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', px: '2px' }}>
            <i className='tabler-volume text-xs' style={{ color: '#94a3b8', fontSize: '13px' }} />
            <Slider
              value={volume * 100}
              min={0}
              max={100}
              onChange={(_, v) => setVolume((v as number) / 100)}
              size='small'
              sx={{
                color: '#10b981',
                height: 3,
                padding: '4px 0',
                '& .MuiSlider-thumb': { width: 10, height: 10, '&:hover': { boxShadow: '0 0 0 8px rgba(16,185,129,0.16)' } },
                '& .MuiSlider-rail': { opacity: 0.15 }
              }}
            />
            <i className='tabler-volume-2 text-xs' style={{ color: '#94a3b8', fontSize: '13px' }} />
          </Box>

          {/* Track dots */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', pt: '2px' }}>
            {MANTRAS.map((_, i) => (
              <button
                key={i}
                onClick={() => { clearProgress(); setCurrentIdx(i) }}
                style={{
                  width: i === currentIdx ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '4px',
                  background: i === currentIdx ? '#10b981' : 'rgba(16,185,129,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>

        </Box>
      )}

      {/* Spin keyframe */}
      <style>{`
        @keyframes om-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  )
}
