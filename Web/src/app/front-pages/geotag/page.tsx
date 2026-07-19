'use client'

import { useState, useRef, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import PageBanner from '@/components/PageBanner'

const GeotagPage = () => {
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

  useEffect(() => {
    startCamera()
    requestLocation()

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
      position => setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 8000 }
    )
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
    } catch (err: any) {
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

        // Draw captured camera frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Overlay Logo at Bottom Center
        drawLogoOverlay(ctx, canvas.width, canvas.height)

        const imgData = canvas.toDataURL('image/jpeg')

        setCapturedImg(imgData)
        setCaptured(true)
        stopCamera()
      }
    } else {
      // Fallback Simulation Capture using a beautiful Temple mockup
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

        // Create a beautiful radial blue backdrop
        const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 350)

        grad.addColorStop(0, '#0f2b5c')
        grad.addColorStop(1, '#050c18')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw a simulated silhouette temple vector in the middle
        ctx.fillStyle = 'rgba(0, 210, 255, 0.15)'
        ctx.beginPath()
        ctx.moveTo(320, 100)
        ctx.lineTo(220, 280)
        ctx.lineTo(420, 280)
        ctx.closePath()
        ctx.fill()

        ctx.fillRect(290, 280, 60, 100)

        // Draw glowing stars
        ctx.fillStyle = '#ffffff'

        for (let i = 0; i < 30; i++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * (canvas.height - 150)

          ctx.fillRect(x, y, 2, 2)
        }

        // Add mock text
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Spiritual Self Tag (Camera Mockup)', 320, 220)

        // Overlay Logo
        drawLogoOverlay(ctx, canvas.width, canvas.height)

        const imgData = canvas.toDataURL('image/jpeg')

        setCapturedImg(imgData)
        setCaptured(true)
      }
    }
  }

  const drawLogoOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Semi-transparent background banner for logo
    ctx.fillStyle = 'rgba(5, 11, 24, 0.75)'
    ctx.fillRect(0, height - 60, width, 60)

    // Gold/Yellow Text for Logo
    ctx.fillStyle = '#00d2ff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🕉️ MANDIR SETU', width / 2, height - 24)
  }

  const handleShare = async () => {
    if (!capturedImg) return

    setSharing(true)
    setShareError(null)

    try {
      // Upload the captured frame first (data URL -> Blob -> real /uploads/... file), matching
      // the same convention every other upload in this app follows — the geotag API only accepts
      // an already-uploaded imageUrl, not a raw base64 data URL.
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
          longitude: coords?.lng ?? null
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
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Banner */}
        <PageBanner
          page='geotag'
          variant='dark'
          defaultTitle='Geo-Tag Yourself'
          defaultSubtitle='Click a picture to geotag your spiritual visit! We will overlay the Mandir Setu brand watermark automatically.'
        />

        {errorMsg && (
          <Alert severity='warning' className='bg-amber-950/60 text-amber-200 border border-amber-500/20 mb-8'>
            {errorMsg}
          </Alert>
        )}

        <Card className='galaxy-card p-6 flex flex-col items-center justify-center'>
          <Box className='relative w-full max-w-2xl h-96 rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950 flex items-center justify-center mb-6 shadow-2xl'>
            {/* Live Camera Stream */}
            {!captured && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
              />
            )}

            {/* If camera fails or not active and not captured */}
            {!captured && !streamActive && (
              <div className='flex flex-col items-center justify-center p-6 text-center'>
                <i className='tabler-camera text-5xl text-slate-500 mb-4' />
                <Typography className='text-slate-400 font-semibold mb-2'>
                  Camera Feed Offline
                </Typography>
                <Typography className='text-slate-500 text-xs max-w-sm mb-4'>
                  Click the button below to capture a simulated geo-tagged photo with a spiritual temple frame overlay.
                </Typography>
              </div>
            )}

            {/* Captured Preview */}
            {captured && capturedImg && (
              <img src={capturedImg} alt='Captured Tag' className='w-full h-full object-contain' />
            )}

            {/* Hidden Canvas used for capturing & overlays */}
            <canvas ref={canvasRef} className='hidden' />
          </Box>

          {success && (
            <Alert severity='success' className='bg-emerald-950/80 text-emerald-200 border border-orange-400/20 w-full mb-6'>
              Photo successfully tagged and shared on the Mandir Setu live community board!
            </Alert>
          )}

          {shareError && (
            <Alert severity='error' className='w-full mb-6'>
              {shareError}
            </Alert>
          )}

          {captured && !success && locationDenied && (
            <Typography className='text-slate-500 text-xs mb-4 text-center'>
              Location access wasn't granted — your photo will be shared without a location tag.
            </Typography>
          )}

          <div className='flex gap-4 justify-center'>
            {!captured ? (
              <Button
                onClick={capturePhoto}
                className='galaxy-glow-btn font-bold px-8 py-3.5 text-lg'
              >
                Tag Yourself
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleReset}
                  variant='outlined'
                  disabled={sharing}
                  className='border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-bold px-6 py-2.5'
                >
                  Retake Photo
                </Button>
                {!success && (
                  <Button
                    onClick={handleShare}
                    disabled={sharing}
                    className='galaxy-glow-btn font-bold px-8 py-2.5'
                  >
                    {sharing ? 'Sharing...' : 'Share with Community'}
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default GeotagPage
