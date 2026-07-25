'use client'

import { useState, useRef, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import PageBanner from '@/components/PageBanner'
import RewardsSection from '@/components/geotag/RewardsSection'
import MapSection from '@/components/geotag/MapSection'

type NearestTemple = { id: string; name: string; distanceMeters: number } | null

const TagSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streamActive, setStreamActive] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [capturedImg, setCapturedImg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [nearestTemple, setNearestTemple] = useState<NearestTemple>(null)
  const [pointsPerTag, setPointsPerTag] = useState<number | null>(null)
  const [templeName, setTempleName] = useState('')
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    startCamera()
    requestLocation()

    fetch('/api/geotag/settings')
      .then(res => res.json())
      .then(data => setPointsPerTag(data?.pointsPerTag ?? null))
      .catch(() => {})

    return () => {
      stopCamera()
    }
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationDenied(true)

      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setCoords({ lat, lng })
        detectNearestTemple(lat, lng)
      },
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const detectNearestTemple = async (lat: number, lng: number) => {
    setDetecting(true)

    try {
      const res = await fetch(`/api/geotag/nearest?lat=${lat}&lng=${lng}`)
      const data = await res.json().catch(() => null)

      if (res.ok && data) {
        setNearestTemple(data.temple ?? null)
        if (data.pointsPerTag != null) setPointsPerTag(data.pointsPerTag)
        if (data.temple?.name) setTempleName(data.temple.name)
      }
    } catch {
      // Location detection is a convenience, not a requirement — user can always type the name manually
    } finally {
      setDetecting(false)
    }
  }

  const startCamera = async () => {
    setErrorMsg(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreamActive(true)
      }
    } catch {
      setErrorMsg('Camera access is not permitted or unsupported by this browser. Simulating tagging mode with a temple backdrop!')
      setStreamActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setStreamActive(false)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (canvas && video && streamActive) {
      const ctx = canvas.getContext('2d')

      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        drawLogoOverlay(ctx, canvas.width, canvas.height)

        const imgData = canvas.toDataURL('image/jpeg')

        setCapturedImg(imgData)
        setCaptured(true)
        stopCamera()
      }
    } else {
      simulateCapture()
    }
  }

  const simulateCapture = () => {
    const canvas = canvasRef.current

    if (canvas) {
      const ctx = canvas.getContext('2d')

      if (ctx) {
        canvas.width = 640
        canvas.height = 480

        const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 350)

        grad.addColorStop(0, '#0c3d29')
        grad.addColorStop(1, '#062418')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)'
        ctx.beginPath()
        ctx.moveTo(320, 100)
        ctx.lineTo(220, 280)
        ctx.lineTo(420, 280)
        ctx.closePath()
        ctx.fill()

        ctx.fillRect(290, 280, 60, 100)

        ctx.fillStyle = '#e2e8f0'
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Spiritual Self Tag (Camera Mockup)', 320, 220)

        drawLogoOverlay(ctx, canvas.width, canvas.height)

        const imgData = canvas.toDataURL('image/jpeg')

        setCapturedImg(imgData)
        setCaptured(true)
      }
    }
  }

  const drawLogoOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 98, 65, 0.85)'
    ctx.fillRect(0, height - 60, width, 60)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🕉️ MANDIR SETU', width / 2, height - 24)
  }

  const handleShare = async () => {
    if (!capturedImg) return

    if (!templeName.trim()) {
      setShareError('Please enter the temple name before sharing.')

      return
    }

    setSharing(true)
    setShareError(null)

    try {
      const blob = await (await fetch(capturedImg)).blob()
      const formData = new FormData()

      formData.append('file', new File([blob], 'geotag.jpg', { type: 'image/jpeg' }))
      formData.append('type', 'default')

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json().catch(() => null)

      if (!uploadRes.ok) throw new Error(uploadData?.error || 'Failed to upload photo.')

      const response = await fetch('/api/geotag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          templeName: templeName.trim(),
          suggestedTempleName: nearestTemple?.name ?? null
        })
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) throw new Error(data?.error || 'Failed to share photo.')

      setSuccess(true)
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to share photo. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const handleReset = () => {
    setCaptured(false)
    setCapturedImg(null)
    setSuccess(false)
    startCamera()
  }

  return (
    <Card className='p-6 flex flex-col items-center justify-center border border-slate-200/60'>
      <Box className='relative w-full max-w-2xl h-96 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center mb-6'>
        {!captured && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
          />
        )}

        {!captured && !streamActive && (
          <div className='flex flex-col items-center justify-center p-6 text-center'>
            <i className='tabler-camera text-5xl text-slate-500 mb-4' />
            <Typography className='text-slate-300 font-semibold mb-2'>Camera Feed Offline</Typography>
            <Typography className='text-slate-400 text-xs max-w-sm mb-4'>
              Click the button below to capture a simulated geo-tagged photo with a spiritual temple frame overlay.
            </Typography>
          </div>
        )}

        {captured && capturedImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capturedImg} alt='Captured Tag' className='w-full h-full object-contain' />
        )}

        <canvas ref={canvasRef} className='hidden' />
      </Box>

      {errorMsg && !captured && (
        <Alert severity='warning' className='w-full mb-4'>
          {errorMsg}
        </Alert>
      )}

      {success ? (
        <Alert severity='success' className='w-full mb-6'>
          Photo submitted! Once our team approves your tag you'll earn {pointsPerTag ?? 'your'} points — check the My
          Rewards tab.
        </Alert>
      ) : (
        captured && (
          <div className='w-full mb-6'>
            <TextField
              fullWidth
              label='Temple / Mandir Name'
              value={templeName}
              onChange={e => setTempleName(e.target.value)}
              helperText={
                detecting
                  ? 'Detecting nearby temple from your location…'
                  : nearestTemple
                    ? `Detected: ${nearestTemple.name} (${Math.round(nearestTemple.distanceMeters)}m away). Edit if this isn't correct.`
                    : "We couldn't detect a nearby temple — please enter its name."
              }
            />
            {pointsPerTag != null && (
              <Typography variant='caption' className='block mt-2' style={{ color: '#10b981' }}>
                Earn {pointsPerTag} points once your tag is approved by our team!
              </Typography>
            )}
          </div>
        )
      )}

      {shareError && (
        <Alert severity='error' className='w-full mb-6'>
          {shareError}
        </Alert>
      )}

      {captured && !success && locationDenied && (
        <Typography variant='caption' className='mb-4 text-center' style={{ color: '#6b7280' }}>
          Location access wasn't granted — please enter the temple name manually.
        </Typography>
      )}

      <div className='flex gap-4 justify-center flex-wrap'>
        {!captured ? (
          <Button variant='contained' onClick={capturePhoto} className='font-bold px-8 py-3.5 text-lg' style={{ textTransform: 'none' }}>
            Tag Yourself
          </Button>
        ) : (
          <>
            <Button onClick={handleReset} variant='outlined' disabled={sharing} className='font-bold px-6 py-2.5' style={{ textTransform: 'none' }}>
              Retake Photo
            </Button>
            {!success && (
              <Button
                variant='contained'
                onClick={handleShare}
                disabled={sharing}
                className='font-bold px-8 py-2.5'
                style={{ textTransform: 'none' }}
              >
                {sharing ? 'Sharing...' : 'Share with Community'}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

const GeotagPage = () => {
  const [tab, setTab] = useState<'tag' | 'rewards' | 'map'>('tag')

  return (
    <div className='min-h-screen py-24 px-6' style={{ background: '#f8fafc' }}>
      <div className='max-w-4xl mx-auto'>
        <PageBanner
          page='geotag'
          defaultTitle='Geo-Tag Your Temple Visit'
          defaultSubtitle='Tag your spiritual visits, earn points, and redeem them for real rewards.'
        />

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          centered
          className='mb-8'
          TabIndicatorProps={{ style: { backgroundColor: '#10b981' } }}
        >
          <Tab label='Tag Yourself' value='tag' />
          <Tab label='My Rewards' value='rewards' />
          <Tab label='Community Map' value='map' />
        </Tabs>

        {tab === 'tag' && <TagSection />}
        {tab === 'rewards' && <RewardsSection />}
        {tab === 'map' && <MapSection />}
      </div>
    </div>
  )
}

export default GeotagPage
