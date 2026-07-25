// A lightweight India outline + pin-plotting map. This is a simplified/approximate silhouette
// (not a traced political map) — I couldn't fetch the Wikimedia SVG file directly, so instead
// every point (outline vertices AND pins) goes through the same lat/lng -> SVG projection, which
// keeps pins positioned correctly *relative to each other and to the country's general shape*
// even though the outline itself is stylized rather than cartographically precise.

const LAT_MIN = 6.5
const LAT_MAX = 37.5
const LNG_MIN = 68
const LNG_MAX = 97.5

const VIEW_WIDTH = 500
const VIEW_HEIGHT = 560

export function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VIEW_WIDTH
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VIEW_HEIGHT

  return { x, y }
}

// Approximate boundary trace (lat, lng) — Gujarat coast -> Kutch -> Rajasthan/Punjab border ->
// J&K -> Himalayan northern border -> northeastern appendage -> Bangladesh border -> West
// Bengal/Odisha/Andhra/Tamil Nadu east coast -> Kanyakumari -> Kerala/Karnataka/Goa/Maharashtra
// west coast -> back to Gujarat. Deliberately low-poly/illustrative.
const BOUNDARY: [number, number][] = [
  [22.5, 69.0], [23.9, 68.2], [24.3, 71.0], [23.0, 70.2], [26.5, 70.0], [28.9, 74.5],
  [32.5, 74.5], [34.8, 74.0], [35.6, 76.9], [34.5, 78.0], [32.5, 79.0], [30.3, 81.1],
  [28.0, 88.1], [27.0, 88.9], [26.5, 89.9], [27.8, 91.5], [28.2, 96.2], [27.5, 97.4],
  [25.2, 95.0], [24.0, 93.3], [23.0, 91.7], [22.2, 89.0], [21.5, 88.9], [20.0, 86.9],
  [17.7, 83.3], [15.9, 80.3], [13.1, 80.3], [10.3, 79.9], [8.1, 77.5], [9.5, 76.5],
  [11.9, 75.3], [14.6, 74.1], [15.4, 73.8], [17.0, 73.3], [19.1, 72.8], [20.7, 70.8],
  [22.5, 69.0]
]

const BOUNDARY_PATH = BOUNDARY.map(([lat, lng], i) => {
  const { x, y } = project(lat, lng)

  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
}).join(' ') + ' Z'

export type MapPin = {
  id: string
  latitude: number
  longitude: number
  label?: string
  imageUrl?: string
}

const IndiaMap = ({ pins, onPinClick }: { pins: MapPin[]; onPinClick?: (pin: MapPin) => void }) => (
  <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className='w-full h-auto' role='img' aria-label='Map of India with tagged temple visits'>
    <path d={BOUNDARY_PATH} fill='rgba(16,185,129,0.08)' stroke='#10b981' strokeWidth={1.5} strokeLinejoin='round' />

    {pins.map(pin => {
      const { x, y } = project(pin.latitude, pin.longitude)

      return (
        <g
          key={pin.id}
          transform={`translate(${x}, ${y})`}
          onClick={() => onPinClick?.(pin)}
          style={{ cursor: onPinClick ? 'pointer' : 'default' }}
        >
          <circle r={7} fill='#006241' opacity={0.25}>
            <animate attributeName='r' values='7;12;7' dur='2.5s' repeatCount='indefinite' />
            <animate attributeName='opacity' values='0.25;0;0.25' dur='2.5s' repeatCount='indefinite' />
          </circle>
          <circle r={4.5} fill='#10b981' stroke='#ffffff' strokeWidth={1.2} />
        </g>
      )
    })}
  </svg>
)

export default IndiaMap
