'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'

export type MantraTrack = {
  id: string
  title: string
  subtitle: string
  fileUrl: string
  duration: string
  deity: string
}

type MantraContextType = {
  tracks: MantraTrack[]
  currentTrackIndex: number | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playTrack: (index: number) => void
  togglePlay: () => void
  seek: (time: number) => void
  loading: boolean
}

const MantraContext = createContext<MantraContextType | undefined>(undefined)

export const MantraProvider = ({ children }: { children: React.ReactNode }) => {
  const [tracks, setTracks] = useState<MantraTrack[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch mantras from DB
  const fetchMantras = async () => {
    try {
      const res = await fetch('/api/mantra')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTracks(data)
      }
    } catch (e) {
      console.error('Failed to load mantras', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMantras()
  }, [])

  useEffect(() => {
    // Initialize HTML5 Audio
    audioRef.current = new Audio()
    const audio = audioRef.current

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      // Auto play next track or stop
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const playTrack = (index: number) => {
    if (!audioRef.current || tracks.length === 0) return

    if (currentTrackIndex === index) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play().catch(e => console.log('Audio play error:', e))
        setIsPlaying(true)
      }
    } else {
      audioRef.current.pause()
      audioRef.current.src = tracks[index].fileUrl
      audioRef.current.load()
      setCurrentTrackIndex(index)
      setIsPlaying(true)
      audioRef.current.play().catch(e => console.log('Audio play error:', e))
    }
  }

  const togglePlay = () => {
    if (!audioRef.current || currentTrackIndex === null) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(e => console.log('Audio play error:', e))
      setIsPlaying(true)
    }
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <MantraContext.Provider
      value={{
        tracks,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        playTrack,
        togglePlay,
        seek,
        loading
      }}
    >
      {children}
    </MantraContext.Provider>
  )
}

export const useMantra = () => {
  const context = useContext(MantraContext)
  if (!context) {
    throw new Error('useMantra must be used within a MantraProvider')
  }
  return context
}
