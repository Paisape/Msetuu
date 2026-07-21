'use client'

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import GoogleAdSense from '@/components/ads/GoogleAdSense'
import AdBanner from '@/components/ads/AdBanner'

type VrMediaItem = {
  id: string
  slug: string
  title: string
  description: string | null
  mediaType: 'VR_360_IMAGE' | 'VR_360_VIDEO' | 'HD_VIDEO'
  mediaUrl: string
  thumbnailUrl: string | null
  active: boolean
  viewsCount: number
  createdAt: string
}

type AdConfig = {
  clientId: string
  autoAdsEnabled: boolean
  prerollEnabled: boolean
  prerollSeconds: number
  overlayAdsEnabled: boolean
  prerollSlotId: string
  headerSlotId: string
  bottomSlotId: string
  sidebarSlotId: string
}

export default function VrExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [item, setItem] = useState<VrMediaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  // AdSense & Pre-Roll / Overlay States
  const [adConfig, setAdConfig] = useState<AdConfig | null>(null)
  const [showPreRoll, setShowPreRoll] = useState(false)
  const [preRollTimer, setPreRollTimer] = useState(5)
  const [showOverlayAd, setShowOverlayAd] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }

    // Load VR Media Item
    fetch(`/api/vr/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('VR Experience not found.')
        return res.json()
      })
      .then(data => {
        setItem(data)
      })
      .catch(err => {
        setError(err.message || 'Failed to load VR experience.')
      })
      .finally(() => {
        setLoading(false)
      })

    // Load AdSense Config
    fetch('/api/adsense')
      .then(res => res.json())
      .then(data => {
        setAdConfig(data)
        if (data.prerollEnabled) {
          setShowPreRoll(true)
          setPreRollTimer(data.prerollSeconds || 5)
        }
        if (data.overlayAdsEnabled !== undefined) {
          setShowOverlayAd(data.overlayAdsEnabled)
        }
      })
      .catch(() => null)
  }, [slug])

  // Pre-Roll Countdown Timer effect
  useEffect(() => {
    if (!showPreRoll) return

    if (preRollTimer > 0) {
      const timer = setTimeout(() => {
        setPreRollTimer(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showPreRoll, preRollTimer])

  // Handle dismissal of Pre-Roll Ad
  const handleDismissPreRoll = () => {
    setShowPreRoll(false)
    if (videoRef.current) {
      videoRef.current.play().catch(() => null)
    }
  }

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const qrImageUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`
    : ''

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-950 text-white flex items-center justify-center p-6'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin'></div>
          <p className='text-amber-300 font-medium'>Loading VR Virtual Darshan...</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className='min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center'>
        <div className='w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 text-2xl mb-4'>
          ⚠️
        </div>
        <h1 className='text-2xl font-bold text-slate-100 mb-2'>VR Experience Not Found</h1>
        <p className='text-slate-400 max-w-md mb-6'>This VR Virtual Darshan link may have expired or is unavailable.</p>
        <Link href='/' className='px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors'>
          Return to Home
        </Link>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 flex flex-col'>
      {/* Inject Google AdSense Script */}
      <GoogleAdSense />

      {/* Top Navigation */}
      <header className='border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-4 py-3'>
        <div className='max-w-6xl mx-auto flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2 font-bold text-lg text-amber-400 hover:text-amber-300 transition-colors'>
            <span>Mandirsetuu VR</span>
          </Link>
          <div className='flex items-center gap-3'>
            <button
              onClick={copyLink}
              className='px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-md border border-slate-700 transition-colors flex items-center gap-2'
            >
              {copied ? '✓ Link Copied!' : '🔗 Share VR Link'}
            </button>
          </div>
        </div>
      </header>

      {/* Header Banner Ad Slot */}
      <div className='max-w-6xl mx-auto w-full px-4 pt-4'>
        <AdBanner slotType='header' />
      </div>

      {/* Main VR Viewer Area */}
      <main className='max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col lg:flex-row gap-8'>
        {/* Left / Main Section: Media Player */}
        <div className='flex-1 flex flex-col gap-6'>
          <div className='relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-950/30 group'>
            
            {/* 1. PRE-ROLL AD OVERLAY (Before Start Video / VR) */}
            {showPreRoll && (
              <div className='absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-2 border-amber-500/40 rounded-2xl'>
                <div className='max-w-md w-full flex flex-col items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-xl shadow-2xl'>
                  <div className='flex items-center justify-between w-full border-b border-slate-800 pb-3'>
                    <span className='text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1.5'>
                      <span>📺</span> Sponsor Advertisement
                    </span>
                    <span className='text-xs text-slate-400 font-mono'>
                      {preRollTimer > 0 ? `VR starts in ${preRollTimer}s` : 'VR Ready'}
                    </span>
                  </div>

                  {/* Pre-Roll Ad Banner Container */}
                  <div className='w-full min-h-[140px] flex items-center justify-center bg-slate-950/80 rounded-lg p-2 border border-slate-800'>
                    <AdBanner slotId={adConfig?.prerollSlotId} slotType='bottom' />
                  </div>

                  {/* Action Button: Skip Ad / Start VR */}
                  <button
                    onClick={handleDismissPreRoll}
                    className={`w-full py-2.5 px-6 font-semibold text-sm rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                      preRollTimer <= 0
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 cursor-pointer animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {preRollTimer <= 0 ? '▶ Watch 360° VR Experience Now' : `Skip Ad (${preRollTimer}s)`}
                  </button>
                </div>
              </div>
            )}

            {/* 2. MAIN MEDIA PLAYER (VR Video / HD Video / 360 Image) */}
            {item.mediaType === 'VR_360_VIDEO' || item.mediaType === 'HD_VIDEO' ? (
              <video
                ref={videoRef}
                src={item.mediaUrl}
                poster={item.thumbnailUrl || undefined}
                controls
                autoPlay={!showPreRoll}
                playsInline
                loop
                className='w-full h-full object-contain'
              />
            ) : item.mediaUrl.endsWith('.mp4') || item.mediaUrl.endsWith('.webm') ? (
              <video
                ref={videoRef}
                src={item.mediaUrl}
                poster={item.thumbnailUrl || undefined}
                controls
                autoPlay={!showPreRoll}
                playsInline
                loop
                className='w-full h-full object-contain'
              />
            ) : (
              /* VR 360 Image / Panorama */
              <div className='relative w-full h-full flex items-center justify-center bg-slate-900'>
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className='w-full h-full object-cover'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6'>
                  <div className='bg-slate-900/90 backdrop-blur border border-amber-500/30 rounded-lg px-4 py-2 text-xs font-semibold text-amber-300 tracking-wide flex items-center gap-2'>
                    <span>🥽 360° VR Panoramic Darshan Mode Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ON-SCREEN OVERLAY AD (Floating on player bottom) */}
            {showOverlayAd && !showPreRoll && (
              <div className='absolute bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-[90%] sm:max-w-md w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 shadow-2xl flex flex-col items-center'>
                <div className='flex items-center justify-between w-full px-2 pb-1 border-b border-slate-800/80 mb-1'>
                  <span className='text-[10px] uppercase font-bold tracking-wider text-amber-400'>Ad Overlay</span>
                  <button
                    onClick={() => setShowOverlayAd(false)}
                    className='text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors'
                    title='Close Ad'
                  >
                    ✕ Close
                  </button>
                </div>
                <AdBanner slotId={adConfig?.prerollSlotId} slotType='bottom' className='!my-0' />
              </div>
            )}

          </div>

          {/* Title and Info */}
          <div className='bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col gap-4'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <span className='inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2'>
                  {item.mediaType.replace('_', ' ')}
                </span>
                <h1 className='text-2xl sm:text-3xl font-bold text-white'>{item.title}</h1>
              </div>
              <div className='flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300'>
                <span>👁️ {item.viewsCount + 1} Views</span>
              </div>
            </div>

            {item.description && (
              <p className='text-slate-300 leading-relaxed text-sm sm:text-base border-t border-slate-800/80 pt-4'>
                {item.description}
              </p>
            )}
          </div>

          {/* Bottom Banner Ad Slot */}
          <div className='w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-2'>
            <AdBanner slotType='bottom' />
          </div>
        </div>

        {/* Right Section: Sidebar + QR Code + Sharing + Sidebar Ad */}
        <aside className='w-full lg:w-80 flex flex-col gap-6'>
          {/* Shareable QR Code Card */}
          <div className='bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-6 flex flex-col items-center text-center shadow-lg'>
            <div className='w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg mb-3'>
              📱
            </div>
            <h3 className='font-bold text-white text-base mb-1'>Scan to Watch in VR</h3>
            <p className='text-xs text-slate-400 mb-4'>Scan with your smartphone camera to open on mobile or VR headset.</p>

            {qrImageUrl && (
              <div className='bg-white p-3 rounded-xl shadow-md mb-4 border border-amber-300/40'>
                <img src={qrImageUrl} alt='VR Experience QR Code' className='w-44 h-44 object-contain' />
              </div>
            )}

            <button
              onClick={copyLink}
              className='w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-lg transition-colors shadow-md shadow-amber-950/50 flex items-center justify-center gap-2'
            >
              {copied ? '✓ Link Copied to Clipboard!' : '📋 Copy VR Link'}
            </button>
          </div>

          {/* Sidebar Banner Ad Slot */}
          <div className='bg-slate-900/40 border border-slate-800/60 rounded-xl p-2'>
            <AdBanner slotType='sidebar' />
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className='border-t border-slate-800/80 bg-slate-950 text-slate-400 py-6 px-4 text-center text-xs'>
        <p>© {new Date().getFullYear()} Mandirsetuu. All Rights Reserved. VR Virtual Darshan Experience.</p>
      </footer>
    </div>
  )
}
