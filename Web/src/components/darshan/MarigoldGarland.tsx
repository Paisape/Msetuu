// A decorative marigold garland (toran) arch, built from layered rows of overlapping "puff"
// circles rather than a photo — so it scales cleanly at any size and needs no image asset.
// Mirrors the reference look: a scalloped yellow marigold valance across the top with an
// orange/saffron underlayer and a thin white + green trim, plus long hanging strands down each
// side, the way a real toran is hung over a temple/mandir doorway.

type Puff = { cx: number; cy: number; r: number; color: string }

const YELLOW = ['#f6b90c', '#f7c419', '#facc3a']
const ORANGE = ['#ef7d1a', '#f2871f', '#e86b0c']
const WHITE = '#fdf6e8'
const GREEN = '#2f5d34'

// Builds one scalloped row of overlapping circles along a sine-wave baseline, so each "loop"
// droops slightly like real strung flowers — reused for the yellow/orange/white layers.
const buildRow = (
  width: number,
  baseline: number,
  amplitude: number,
  puffRadius: number,
  spacing: number,
  colors: string[],
  seedOffset = 0
): Puff[] => {
  const puffs: Puff[] = []
  let x = spacing / 2
  let i = 0

  while (x < width) {
    const cy = baseline + Math.sin((x / width) * Math.PI * 6 + seedOffset) * amplitude
    const color = colors[i % colors.length]

    puffs.push({ cx: x, cy, r: puffRadius, color })
    x += spacing
    i++
  }

  return puffs
}

const MarigoldGarland = ({ width = 900, height = 130, className = '' }: { width?: number; height?: number; className?: string }) => {
  const yellowRow = buildRow(width, height * 0.42, 10, 15, 22, YELLOW, 0)
  const orangeRow = buildRow(width, height * 0.58, 8, 10, 22, ORANGE, 0.9)
  const whiteRow = buildRow(width, height * 0.7, 6, 5, 22, [WHITE], 1.6)

  // Long vertical hanging strands at each side, like the two garlands framing a doorway.
  const leftStrand = Array.from({ length: 9 }).map((_, i) => ({
    cy: height * 0.75 + i * 26,
    color: i % 2 === 0 ? YELLOW[i % YELLOW.length] : ORANGE[i % ORANGE.length],
    r: i % 3 === 0 ? 12 : 9
  }))

  const rightStrand = leftStrand

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 220}`}
      className={className}
      preserveAspectRatio='xMidYMin meet'
      aria-hidden='true'
    >
      {/* Top mounting cord */}
      <path
        d={`M 4 6 Q ${width / 2} ${height * 0.15} ${width - 4} 6`}
        stroke='#8a5a2b'
        strokeWidth={3}
        fill='none'
        opacity={0.5}
      />

      {/* Green leaf trim, sits just under the white row */}
      {buildRow(width, height * 0.78, 5, 4, 14, [GREEN], 2.3).map((p, i) => (
        <rect
          key={`leaf-${i}`}
          x={p.cx - 2}
          y={p.cy - 6}
          width={4}
          height={12}
          rx={2}
          fill={p.color}
          transform={`rotate(${(i % 2 === 0 ? 20 : -20)} ${p.cx} ${p.cy})`}
        />
      ))}

      {/* Orange/saffron underlayer */}
      {orangeRow.map((p, i) => (
        <circle key={`o-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity={0.95} />
      ))}

      {/* Main yellow marigold valance */}
      {yellowRow.map((p, i) => (
        <g key={`y-${i}`}>
          <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.color} />
          <circle cx={p.cx} cy={p.cy} r={p.r * 0.45} fill='#c9860a' opacity={0.5} />
        </g>
      ))}

      {/* White flower accents on top */}
      {whiteRow.map((p, i) => (
        <circle key={`w-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity={0.9} />
      ))}

      {/* Left hanging strand */}
      {leftStrand.map((p, i) => (
        <circle key={`ls-${i}`} cx={22} cy={p.cy} r={p.r} fill={p.color} />
      ))}

      {/* Right hanging strand */}
      {rightStrand.map((p, i) => (
        <circle key={`rs-${i}`} cx={width - 22} cy={p.cy} r={p.r} fill={p.color} />
      ))}
    </svg>
  )
}

export default MarigoldGarland
