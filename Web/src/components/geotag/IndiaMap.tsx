'use client'

import { useState, useEffect } from 'react'

// A lightweight India outline + pin-plotting map.
import {
  project,
  BOUNDARY_PATH,
  STATES_CENTERS,
  getPathD,
  VIEW_WIDTH,
  VIEW_HEIGHT
} from '@/libs/indiaMapData'

export type MapPin = {
  id: string
  latitude: number
  longitude: number
  label?: string
  imageUrl?: string
}

const IndiaMap = ({ pins, onPinClick }: { pins: MapPin[]; onPinClick?: (pin: MapPin) => void }) => {
  const [geoJson, setGeoJson] = useState<any>(null)

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    fetch(`${origin}/maps/india-states.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load map data')
        
return res.json()
      })
      .then((data) => setGeoJson(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className='w-full h-auto' role='img' aria-label='Map of India with tagged temple visits'>
      {/* Background soft color fill */}
      <path d={BOUNDARY_PATH} fill='rgba(255, 103, 31, 0.08)' stroke='none' />

      {/* State boundary polygons */}
      {geoJson?.features?.map((feature: any, idx: number) => {
        const d = getPathD(feature.geometry)

        
return (
          <path
            key={idx}
            d={d}
            fill='rgba(255, 103, 31, 0.04)'
            stroke='#FF671F'
            strokeWidth={0.5}
            opacity={0.35}
            strokeLinejoin='round'
          />
        )
      })}

      {/* Main outer border line */}
      <path d={BOUNDARY_PATH} fill='none' stroke='#FF671F' strokeWidth={2.0} strokeLinejoin='round' />

      {/* Faint State Name Labels */}
      {STATES_CENTERS.map((st, i) => {
        const { x, y } = project(st.lat, st.lng)

        
return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor='middle'
            fill='#d35400'
            opacity={0.45}
            style={{
              fontSize: '7px',
              fontWeight: 850,
              fontFamily: 'sans-serif',
              pointerEvents: 'none'
            }}
          >
            {st.name}
          </text>
        )
      })}

      {pins.map(pin => {
        const { x, y } = project(pin.latitude, pin.longitude)

        return (
          <g
            key={pin.id}
            transform={`translate(${x}, ${y})`}
            onClick={() => onPinClick?.(pin)}
            style={{ cursor: onPinClick ? 'pointer' : 'default' }}
          >
            {/* Animated pulse halo */}
            <circle r={12} fill='#FF671F' opacity={0.2}>
              <animate attributeName='r' values='12;20;12' dur='2.5s' repeatCount='indefinite' />
              <animate attributeName='opacity' values='0.2;0;0.2' dur='2.5s' repeatCount='indefinite' />
            </circle>

            {/* Mandir Icon */}
            {/* 1. Flag Pole & Flag */}
            <path d="M 0,-10 L 0,-18 L 6,-15 Z" fill="#FF3D00" />
            {/* 2. Shikhara (Spire/Roof) */}
            <path d="M 0,-10 L -8,-2 L 8,-2 Z" fill="#FF671F" stroke="#ffffff" strokeWidth={0.8} />
            {/* 3. Base Sanctuary */}
            <rect x={-8} y={-2} width={16} height={9} fill="#FF671F" stroke="#ffffff" strokeWidth={0.8} rx={1} />
            {/* 4. Sacred Doorway (White Gopuram Arch) */}
            <path d="M -2.5,7 L -2.5,2.5 Q 0,0.5 2.5,2.5 L 2.5,7 Z" fill="#ffffff" />

            {/* Temple Label with White Outline Halo */}
            <text
              y={17}
              textAnchor='middle'
              fill='#1e293b'
              style={{
                fontSize: '8px',
                fontWeight: 800,
                fontFamily: 'sans-serif',
                textShadow: '1px 1px 0px #ffffff, -1px -1px 0px #ffffff, 1px -1px 0px #ffffff, -1px 1px 0px #ffffff',
                pointerEvents: 'none'
              }}
            >
              {pin.label || 'Temple'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default IndiaMap
