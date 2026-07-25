'use client'

import { useState, useEffect, useRef } from 'react'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

import PageBanner from '@/components/PageBanner'
import MarigoldGarland from '@/components/darshan/MarigoldGarland'
import { playLightSound, playFlowerSound } from '@/libs/darshanSounds'

type DarshanDay = {
  id: string
  dayOfWeek: number
  deityName: string
  image: string
  bhajanTitle: string | null
  bhajanUrl: string | null
  description: string | null
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FLOWER_EMOJIS = ['🌸', '🌺', '🏵️', '🌼']

type Petal = { id: number; left: number; delay: number; emoji: string }

// A round icon+label button for each temple interaction — reused for flower/bell/deepak/
// agarbati/sankh so they all share the same look and active-state glow.
const InteractionButton = ({
  emoji,
  label,
  onClick,
  active
}: {
  emoji: string
  label: string
  onClick: () => void
  active?: boolean
}) => (
  <Tooltip title={label}>
    <Box className='flex flex-col items-center gap-1.5' style={{ minWidth: 76 }}>
      <IconButton
        onClick={onClick}
        sx={{
          width: 56,
          height: 56,
          fontSize: 26,
          background: active ? 'linear-gradient(135deg,#10b981,#34d399)' : 'rgba(16,185,129,0.08)',
          boxShadow: active ? '0 4px 18px rgba(16,185,129,0.5)' : 'none',
          transition: 'all 0.25s ease',
          '&:hover': { background: active ? 'linear-gradient(135deg,#006241,#10b981)' : 'rgba(16,185,129,0.16)' }
        }}
      >
        <span>{emoji}</span>
      </IconButton>
      <Typography variant='caption' className='font-semibold text-center' style={{ color: '#374151' }}>
        {label}
      </Typography>
    </Box>
  </Tooltip>
)

// Interactive day-wise Darshan: a virtual temple frame showing today's deity (admin-configured,
// one per day of the week) where a visitor can offer a flower, ring the bell, light a deepak/
// agarbati, sound the conch, and play that day's bhajan. Distinct from the "3D Darshan" feature
// (front-pages/darshan-3d) which links out to external 3D/AR temple models via QR codes.
const DarshanPage = () => {
  const [days, setDays] = useState<DarshanDay[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0) // 0 = today, +/- to preview other days
  const [petals, setPetals] = useState<Petal[]>([])
  const [deepakLit, setDeepakLit] = useState(false)
  const [agarbatiLit, setAgarbatiLit] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const petalIdRef = useRef(0)

  useEffect(() => {
    fetch('/api/darshan-daily')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDays(data)
      })
      .catch(() => {
        // Keep the empty state on error — no fake data
      })
      .finally(() => setLoading(false))
  }, [])

  const todayIndex = new Date().getDay()
  const viewedIndex = (todayIndex + (offset % 7) + 7) % 7
  const viewedDay = days.find(d => d.dayOfWeek === viewedIndex) || null
  const isToday = offset === 0

  // Switching day resets every interaction — a flower/flame from the previous day shouldn't
  // linger, and any bhajan that's playing should stop rather than keep playing over a new deity.
  useEffect(() => {
    setPetals([])
    setDeepakLit(false)
    setAgarbatiLit(false)
    setIsPlaying(false)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [viewedIndex])

  const handleFlower = () => {
    playFlowerSound()

    const newPetals: Petal[] = Array.from({ length: 8 }).map(() => ({
      id: petalIdRef.current++,
      left: 8 + Math.random() * 84,
      delay: Math.random() * 0.35,
      emoji: FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)]
    }))

    setPetals(prev => [...prev, ...newPetals])
    setTimeout(() => {
      setPetals(prev => prev.filter(p => !newPetals.some(np => np.id === p.id)))
    }, 2200)
  }

  const handleDeepak = () => {
    if (!deepakLit) playLightSound()
    setDeepakLit(v => !v)
  }

  const handleAgarbati = () => {
    if (!agarbatiLit) playLightSound()
    setAgarbatiLit(v => !v)
  }

  const toggleBhajan = () => {
    const audio = audioRef.current

    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  return (
    <div className='min-h-screen py-20 px-6' style={{ background: 'linear-gradient(180deg,#fffaf0 0%,#fef3e2 100%)' }}>
      <div className='max-w-3xl mx-auto'>
        <PageBanner
          page='darshan-daily'
          variant='emerald'
          defaultTitle='Darshan'
          defaultSubtitle="Offer a flower, ring the temple bell, light a deepak and agarbati, and sound the conch before today's deity — a new darshan for every day of the week."
        />

        {loading ? (
          <div className='flex justify-center py-16'>
            <CircularProgress style={{ color: '#10b981' }} />
          </div>
        ) : days.length === 0 ? (
          <Typography className='text-center py-16' style={{ color: '#6b7280' }}>
            Darshan hasn&apos;t been set up yet — check back soon.
          </Typography>
        ) : (
          <>
            {/* Day navigation */}
            <Box className='flex items-center justify-center gap-3 mb-8'>
              <IconButton onClick={() => setOffset(o => o - 1)} aria-label='Previous day' style={{ color: '#006241' }}>
                <i className='tabler-chevron-left text-2xl' />
              </IconButton>
              <Box className='text-center' style={{ minWidth: 180 }}>
                <Typography variant='h6' className='font-bold' style={{ color: '#006241' }}>
                  {isToday ? 'Today' : 'Previewing'} · {DAY_LABELS[viewedIndex]}
                </Typography>
                {!isToday && (
                  <Button size='small' onClick={() => setOffset(0)} className='font-semibold'>
                    Back to Today
                  </Button>
                )}
              </Box>
              <IconButton onClick={() => setOffset(o => o + 1)} aria-label='Next day' style={{ color: '#006241' }}>
                <i className='tabler-chevron-right text-2xl' />
              </IconButton>
            </Box>

            {/* Mandir frame */}
            <Box className='relative mx-auto pt-6' style={{ maxWidth: 480 }}>
              <MarigoldGarland
                width={480}
                height={100}
                className='w-full absolute top-0 left-0 right-0 z-10 pointer-events-none'
              />

              <Box
                className='relative p-3'
                style={{
                  background: 'linear-gradient(160deg,#8a5a2b 0%,#4a2c14 100%)',
                  borderRadius: '24px 24px 160px 160px',
                  boxShadow: '0 12px 40px rgba(74,44,20,0.35)',
                  marginTop: '16px'
                }}
              >
                <Box
                  className='relative overflow-hidden'
                  style={{
                    aspectRatio: '3 / 4',
                    borderRadius: '16px 16px 150px 150px',
                    background: 'linear-gradient(160deg,#fff7e6,#ffe9b8)',
                    transform: 'translateZ(0)'
                  }}
                >
                  {viewedDay ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewedDay.image}
                        alt={viewedDay.deityName}
                        className='w-full h-full object-cover'
                        style={{ borderRadius: '16px 16px 150px 150px' }}
                      />

                      {petals.map(p => (
                        <span
                          key={p.id}
                          className='darshan-petal'
                          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s` }}
                        >
                          {p.emoji}
                        </span>
                      ))}
                    </>
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-center px-6'>
                      <Typography style={{ color: '#92400e' }}>
                        No deity image has been added for {DAY_LABELS[viewedIndex]} yet.
                      </Typography>
                    </div>
                  )}
                </Box>

                {viewedDay && deepakLit && (
                  <div className='absolute bottom-10 left-12 darshan-flame z-20' style={{ fontSize: 32 }}>
                    🪔
                  </div>
                )}

                {viewedDay && agarbatiLit && (
                  <div className='absolute bottom-10 right-16 z-20' style={{ fontSize: 28 }}>
                    🕯️
                    <span className='darshan-smoke' />
                    <span className='darshan-smoke' style={{ animationDelay: '0.7s' }} />
                    <span className='darshan-smoke' style={{ animationDelay: '1.4s' }} />
                  </div>
                )}
              </Box>

              {viewedDay && (
                <div className='text-center mt-5'>
                  <Typography variant='h5' className='font-bold'>
                    {viewedDay.deityName}
                  </Typography>
                  {viewedDay.description && (
                    <Typography variant='body2' className='max-w-md mx-auto mt-1' style={{ color: '#4b5563' }}>
                      {viewedDay.description}
                    </Typography>
                  )}
                </div>
              )}
            </Box>

            {viewedDay && (
              <>
                {/* Interactions */}
                <Box className='flex justify-center gap-4 flex-wrap mt-8'>
                  <InteractionButton emoji='🌸' label='Offer Flower' onClick={handleFlower} />
                  <InteractionButton emoji='🪔' label='Light Deepak' onClick={handleDeepak} active={deepakLit} />
                  <InteractionButton emoji='🕯️' label='Light Agarbati' onClick={handleAgarbati} active={agarbatiLit} />
                </Box>

                {/* Bhajan player */}
                {viewedDay.bhajanUrl && (
                  <Box
                    className='flex items-center gap-4 mt-10 mx-auto p-4'
                    style={{ maxWidth: 420, borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    <audio ref={audioRef} src={viewedDay.bhajanUrl} onEnded={() => setIsPlaying(false)} />
                    <IconButton
                      onClick={toggleBhajan}
                      sx={{
                        width: 46,
                        height: 46,
                        color: 'white',
                        background: 'linear-gradient(135deg,#10b981,#34d399)',
                        '&:hover': { background: 'linear-gradient(135deg,#006241,#10b981)' }
                      }}
                    >
                      <i className={isPlaying ? 'tabler-player-pause-filled' : 'tabler-player-play-filled'} />
                    </IconButton>
                    <div>
                      <Typography variant='caption' className='font-bold block' style={{ color: '#10b981' }}>
                        {isPlaying ? 'Now Playing' : 'Bhajan'}
                      </Typography>
                      <Typography className='font-semibold' style={{ color: '#0f172a' }}>
                        {viewedDay.bhajanTitle || `${viewedDay.deityName} Bhajan`}
                      </Typography>
                    </div>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes darshan-petal-fall {
          0% {
            transform: translateY(-24px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(340px) rotate(340deg);
            opacity: 0;
          }
        }
        .darshan-petal {
          position: absolute;
          top: 0;
          font-size: 22px;
          animation: darshan-petal-fall 2s ease-in forwards;
          pointer-events: none;
        }

        @keyframes darshan-flame-flicker {
          0%,
          100% {
            transform: scale(1) rotate(-2deg);
            opacity: 1;
          }
          50% {
            transform: scale(0.9) rotate(2deg);
            opacity: 0.85;
          }
        }
        .darshan-flame {
          animation: darshan-flame-flicker 0.6s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.8));
        }

        @keyframes darshan-smoke-rise {
          0% {
            transform: translate(-50%, 0) scale(0.6);
            opacity: 0.55;
          }
          100% {
            transform: translate(-50%, -60px) scale(1.6);
            opacity: 0;
          }
        }
        .darshan-smoke {
          position: absolute;
          left: 50%;
          top: -6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.55);
          filter: blur(2px);
          animation: darshan-smoke-rise 2s ease-out infinite;
          pointer-events: none;
        }
        
      `}</style>
    </div>
  )
}

export default DarshanPage
