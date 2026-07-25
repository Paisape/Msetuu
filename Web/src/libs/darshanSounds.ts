// Small, dependency-free sound effects for the Darshan page's temple interactions (bell, conch,
// deepak-lighting whoosh). Synthesized on the fly with the Web Audio API instead of shipping
// audio files — no licensing to worry about, nothing to upload/host, and it always works
// regardless of network conditions. Bhajan playback (real devotional audio) is a separate,
// admin-uploaded <audio> element on the page — this file is only for the short UI sound effects.

let sharedContext: AudioContext | null = null

// Browsers require a user gesture before audio can play — every call site here is already
// inside a click handler, so this just lazily creates (and resumes) one shared context.
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext

  if (!AudioContextClass) return null

  if (!sharedContext) sharedContext = new AudioContextClass()
  if (sharedContext.state === 'suspended') sharedContext.resume().catch(() => {})

  return sharedContext
}

// Risset-bell partials (inharmonic ratios + per-partial decay) — the same technique used by the
// site's existing global click-bell (see DevotionalMusic.tsx's playTemplateBell), reproduced
// here so the Darshan page's Ghanti button rings with the same authentic bronze-bell character
// rather than a generic beep. Real bells ring with a stack of non-integer-ratio partials, which
// is what gives them their metallic shimmer instead of a flat tone.
const BELL_PARTIALS = [
  { ratio: 1, gain: 1, decay: 2.6 },
  { ratio: 1.99, gain: 0.55, decay: 2.2 },
  { ratio: 2.43, gain: 0.35, decay: 1.8 },
  { ratio: 3.76, gain: 0.22, decay: 1.4 },
  { ratio: 4.11, gain: 0.16, decay: 1.1 },
  { ratio: 5.43, gain: 0.1, decay: 0.7 },
  { ratio: 6.8, gain: 0.06, decay: 0.5 }
]

/** A deep bronze temple bell (ghanta) strike. */
export function playBellSound() {
  const ctx = getAudioContext()

  if (!ctx) return

  const now = ctx.currentTime
  const fundamental = 220
  const master = ctx.createGain()

  master.gain.setValueAtTime(0.5, now)
  master.connect(ctx.destination)

  BELL_PARTIALS.forEach(({ ratio, gain, decay }, i) => {
    const freq = fundamental * ratio

    ;[-3, 3].forEach(cents => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.detune.setValueAtTime(cents, now)

      const peak = (gain / 2) * (1 - i * 0.03)

      gainNode.gain.setValueAtTime(0.0001, now)
      gainNode.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), now + 0.012)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay)

      osc.connect(gainNode)
      gainNode.connect(master)
      osc.start(now)
      osc.stop(now + decay + 0.1)
    })
  })
}

/** A low, breathy sweeping drone approximating a conch (sankh) call. */
export function playSankhSound() {
  const ctx = getAudioContext()

  if (!ctx) return

  const now = ctx.currentTime
  const duration = 2.2

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const noise = ctx.createBufferSource()
  const noiseGain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  // Tonal body: a low note that swells up then trails off, like a real breath-blown conch.
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(140, now)
  osc.frequency.linearRampToValueAtTime(165, now + 0.6)
  osc.frequency.linearRampToValueAtTime(150, now + duration)

  filter.type = 'lowpass'
  filter.frequency.value = 500

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.4)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  // Breath noise layer for realism
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  noise.buffer = buffer

  const noiseFilter = ctx.createBiquadFilter()

  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 400
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.06, now + 0.5)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + duration)
  noise.start(now)
  noise.stop(now + duration)
}

/** A soft rising "whoosh" for lighting a deepak or agarbati. */
export function playLightSound() {
  const ctx = getAudioContext()

  if (!ctx) return

  const now = ctx.currentTime
  const duration = 0.5

  const noise = ctx.createBufferSource()
  const bufferSize = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()

  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(800, now)
  filter.frequency.exponentialRampToValueAtTime(2500, now + duration)

  const gain = ctx.createGain()

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  noise.start(now)
  noise.stop(now + duration)
}

/** A light, quick petal-toss shimmer for offering a flower. */
export function playFlowerSound() {
  const ctx = getAudioContext()

  if (!ctx) return

  const now = ctx.currentTime
  const notes = [1046.5, 1318.5, 1568] // High, sparkly — C6, E6, G6

  notes.forEach((freq, i) => {
    const start = now + i * 0.06
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.4)
  })
}
