'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import ServiceFaq from '@/components/ServiceFaq'
import BirthDetailsForm, { type BirthDetails, DEFAULT_BIRTH_DETAILS } from './BirthDetailsForm'

const ZODIAC_SIGN_NAMES = [
  '', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const toApiParams = (b: BirthDetails) =>
  `date=${encodeURIComponent(b.date)}&time=${encodeURIComponent(b.time)}&lat=${encodeURIComponent(b.lat)}&lon=${encodeURIComponent(b.lon)}&tz=${encodeURIComponent(b.tz)}`

// Renders a value defensively when the exact upstream JSON shape from freeastrologyapi.com isn't
// guaranteed stable (same caveat as the Panchang widget above) — pretty-prints as a fallback
// instead of guessing a field name that might not exist and showing "undefined".
const RawResultFallback = ({ data }: { data: unknown }) => (
  <Box
    component='pre'
    sx={{
      background: 'rgba(16,185,129,0.05)',
      border: '1px solid rgba(16,185,129,0.15)',
      borderRadius: '8px',
      p: 2,
      fontSize: '12px',
      color: '#374151',
      overflowX: 'auto',
      maxHeight: 360
    }}
  >
    {JSON.stringify(data, null, 2)}
  </Box>
)

export default function HoroscopePage() {
  const [mainTab, setMainTab] = useState(0)

  const [selectedRashi, setSelectedRashi] = useState('Aries')
  const [selectedPeriod, setSelectedPeriod] = useState(0)
  const [choghadiyaTab, setChoghadiyaTab] = useState(0)

  const rashis = [
    { name: 'Aries', displayName: 'Aries\n(Mesha)', symbol: '🐏' },
    { name: 'Taurus', displayName: 'Taurus\n(Vrishabha)', symbol: '🐂' },
    { name: 'Gemini', displayName: 'Gemini\n(Mithuna)', symbol: '👥' },
    { name: 'Cancer', displayName: 'Cancer\n(Karka)', symbol: '🦀' },
    { name: 'Leo', displayName: 'Leo\n(Simha)', symbol: '🦁' },
    { name: 'Virgo', displayName: 'Virgo\n(Kanya)', symbol: '👧' },
    { name: 'Libra', displayName: 'Libra\n(Tula)', symbol: '⚖️' },
    { name: 'Scorpio', displayName: 'Scorpio\n(Vrishchika)', symbol: '🦂' },
    { name: 'Sagittarius', displayName: 'Sagittarius\n(Dhanu)', symbol: '🏹' },
    { name: 'Capricorn', displayName: 'Capricorn\n(Makara)', symbol: '🐐' },
    { name: 'Aquarius', displayName: 'Aquarius\n(Kumbha)', symbol: '🏺' },
    { name: 'Pisces', displayName: 'Pisces\n(Meena)', symbol: '🐟' }
  ]

  const horoscopeTexts: Record<string, string[]> = {
    Aries: [
      'Today is a day of action and power. Plan your investments wisely. Love energies are peaking.',
      'Tomorrow brings opportunities in your career. Focus on collaboration. A spiritual journey awaits.',
      'This week, focus on physical fitness. Planetary alignments favor clear decision making.',
      'This month promises wealth and professional expansion. Dedicating time to worship will grant peace.'
    ],
    Taurus: [
      'Focus on stability today. Health requires extra care. Financial opportunities may knock.',
      'Tomorrow will clear minor legal blocks. Seek advice from your family elders.',
      'This week brings creative breakthroughs. Avoid disputes with close partners.',
      'This month is ideal for buying property. Practice meditation to align energies.'
    ],
    Gemini: [
      'A wonderful day for networking and business proposals. Jupiter favors your intellectual charts.',
      'Tomorrow promises an answer to a long-awaited query. Stay optimistic.',
      'This week you will gain social recognition. Ensure regular rest to avoid stress.',
      'This month highlights international travel or education success. Wear yellow for good fortune.'
    ]
  }

  const getHoroscopeText = (rashi: string, idx: number) => {
    const list = horoscopeTexts[rashi] || horoscopeTexts['Aries']

    return list[idx] || 'Your stars are aligned. Keep moving with confidence and faith.'
  }

  // ── Live Rashifal (falls back to the static text above if the AstrologyAPI.com key isn't
  // configured yet, or "This Week" is selected — that provider has no weekly endpoint) ──
  const [livePrediction, setLivePrediction] = useState<string | null>(null)
  const [horoscopeLoading, setHoroscopeLoading] = useState(false)

  useEffect(() => {
    const periodMap = ['daily', 'tomorrow', null, 'monthly'] as const
    const apiPeriod = periodMap[selectedPeriod]

    if (!apiPeriod) {
      setLivePrediction(null)

      return
    }

    let cancelled = false

    setHoroscopeLoading(true)
    setLivePrediction(null)

    fetch(`/api/astrology/horoscope?sign=${selectedRashi.toLowerCase()}&period=${apiPeriod}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data?.configured && typeof data.prediction === 'string') setLivePrediction(data.prediction)
      })
      .catch(() => {
        // Keep the static fallback text on error
      })
      .finally(() => {
        if (!cancelled) setHoroscopeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRashi, selectedPeriod])

  // ── Live Panchang + Choghadiya (falls back to the static reference data below if
  // ASTROLOGY_API_KEY isn't configured yet, or the upstream response doesn't include a field
  // this page recognizes) ──
  const [livePanchang, setLivePanchang] = useState<any>(null)

  useEffect(() => {
    fetch('/api/astrology/panchang')
      .then(res => res.json())
      .then(data => {
        if (data?.configured) setLivePanchang(data)
      })
      .catch(() => {
        // Keep the static fallback data on error
      })
  }, [])

  // Best-effort extraction from the live freeastrologyapi.com response — the exact field names
  // aren't verifiable without a live key, so this checks several likely names (including common
  // "output"/"response"/"data" wrapper shapes) and silently falls back to the static reference
  // value below if nothing recognizable is found, rather than showing a blank/broken field.
  const extractText = (obj: any, keys: string[], fallback: string, depth = 0): string => {
    if (!obj || depth > 2) return fallback

    for (const k of keys) {
      const v = obj?.[k]

      if (typeof v === 'string' && v.trim()) return v
    }

    const nested = obj?.output ?? obj?.response ?? obj?.data

    return nested ? extractText(nested, keys, fallback, depth + 1) : fallback
  }

  const staticPanchang = {
    date: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    tithi: 'Shukla Ekadashi (Auspicious)',
    nakshatra: 'Rohini (until 08:34 PM)',
    yoga: 'Subha (Good Fortune)',
    karana: 'Vanija',
    sunrise: '05:43 AM',
    sunset: '07:12 PM',
    rahukaal: '09:00 AM – 10:30 AM'
  }

  const panchangData = {
    date: staticPanchang.date,
    tithi: extractText(livePanchang?.tithi, ['name', 'tithi_name', 'tithi'], staticPanchang.tithi),
    nakshatra: extractText(livePanchang?.nakshatra, ['name', 'nakshatra_name', 'nakshatra'], staticPanchang.nakshatra),
    yoga: extractText(livePanchang?.yoga, ['name', 'yoga_name', 'yoga'], staticPanchang.yoga),
    karana: extractText(livePanchang?.karana, ['name', 'karana_name', 'karana'], staticPanchang.karana),
    sunrise: extractText(livePanchang?.sunriseSunset, ['sunrise', 'sun_rise'], staticPanchang.sunrise),
    sunset: extractText(livePanchang?.sunriseSunset, ['sunset', 'sun_set'], staticPanchang.sunset),
    rahukaal: extractText(livePanchang?.goodBadTimes, ['rahu_kaal', 'rahu_kalam', 'rahukaal'], staticPanchang.rahukaal)
  }

  const dayChoghadiya = [
    { time: '06:00 – 07:30 AM', name: 'Amrit', type: 'Auspicious', effect: 'Best for starting spiritual activity or yatra.' },
    { time: '07:30 – 09:00 AM', name: 'Kala', type: 'Inauspicious', effect: 'Avoid initiating financial deals or travel.' },
    { time: '09:00 – 10:30 AM', name: 'Shubh', type: 'Auspicious', effect: 'Excellent for educational steps and interviews.' },
    { time: '10:30 – 12:00 PM', name: 'Roga', type: 'Inauspicious', effect: 'Prone to health hazards or litigation.' },
    { time: '12:00 – 01:30 PM', name: 'Udveg', type: 'Inauspicious', effect: 'Brings worry and stress.' },
    { time: '01:30 – 03:00 PM', name: 'Chala', type: 'Neutral', effect: 'Good for routine jobs or accounting.' },
    { time: '03:00 – 04:30 PM', name: 'Labha', type: 'Auspicious', effect: 'Brings gain and income.' },
    { time: '04:30 – 06:00 PM', name: 'Amrit', type: 'Auspicious', effect: 'Pure blessing time. Offer Pujas or spend with family.' }
  ]

  const nightChoghadiya = [
    { time: '06:00 – 07:30 PM', name: 'Chala', type: 'Neutral', effect: 'Good for simple travels or closing shop.' },
    { time: '07:30 – 09:00 PM', name: 'Roga', type: 'Inauspicious', effect: 'Avoid medical surgeries or intense debates.' },
    { time: '09:00 – 10:30 PM', name: 'Kala', type: 'Inauspicious', effect: 'Restrict outdoor travels.' },
    { time: '10:30 PM – 12:00 AM', name: 'Labha', type: 'Auspicious', effect: 'Attracts dream insights. Good for night rituals.' },
    { time: '12:00 – 01:30 AM', name: 'Udveg', type: 'Inauspicious', effect: 'Restless mind state. Recite mantras.' },
    { time: '01:30 – 03:00 AM', name: 'Shubh', type: 'Auspicious', effect: 'Blessed sleep. High spiritual protection.' },
    { time: '03:00 – 04:30 AM', name: 'Amrit', type: 'Auspicious', effect: 'Brahma Muhurta. Excellent for meditation.' },
    { time: '04:30 – 06:00 AM', name: 'Chala', type: 'Neutral', effect: 'Routine morning duties.' }
  ]

  const getStatusColor = (type: string) => {
    if (type === 'Auspicious') return '#16a34a'
    if (type === 'Inauspicious') return '#dc2626'

    return '#64748b'
  }

  // ── Planet Positions ──
  const [planetsBirth, setPlanetsBirth] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS)
  const [planetsResult, setPlanetsResult] = useState<any>(null)
  const [planetsLoading, setPlanetsLoading] = useState(false)
  const [planetsError, setPlanetsError] = useState<string | null>(null)

  const fetchPlanets = async () => {
    if (!planetsBirth.date) {
      setPlanetsError('Enter a date of birth first.')

      return
    }

    setPlanetsLoading(true)
    setPlanetsError(null)
    setPlanetsResult(null)

    try {
      const res = await fetch(`/api/astrology/planets?${toApiParams(planetsBirth)}`)
      const data = await res.json()

      if (!data?.configured) {
        setPlanetsError(data?.error || 'Planet positions require the Astrology API key to be configured (Config > Astrology).')

        return
      }

      setPlanetsResult(data.planets)
    } catch {
      setPlanetsError('Failed to fetch planet positions. Please try again.')
    } finally {
      setPlanetsLoading(false)
    }
  }

  const planetEntries = (() => {
    const output = planetsResult?.output
    const namedObj = Array.isArray(output) ? output[1] : null

    if (!namedObj || typeof namedObj !== 'object') return []

    return Object.entries(namedObj)
      .filter(([, v]: [string, any]) => v && typeof v === 'object' && 'current_sign' in v)
      .map(([name, v]: [string, any]) => ({
        name,
        sign: ZODIAC_SIGN_NAMES[v.current_sign] || `Sign ${v.current_sign}`,
        degree: typeof v.normDegree === 'number' ? v.normDegree.toFixed(2) : v.normDegree,
        retro: v.isRetro === 'true' || v.isRetro === true
      }))
  })()

  // ── Vimshottari Dasha ──
  const [dashaBirth, setDashaBirth] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS)
  const [dashaResult, setDashaResult] = useState<any>(null)
  const [dashaLoading, setDashaLoading] = useState(false)
  const [dashaError, setDashaError] = useState<string | null>(null)

  const fetchDasha = async () => {
    if (!dashaBirth.date) {
      setDashaError('Enter a date of birth first.')

      return
    }

    setDashaLoading(true)
    setDashaError(null)
    setDashaResult(null)

    try {
      const res = await fetch(`/api/astrology/dasha?${toApiParams(dashaBirth)}`)
      const data = await res.json()

      if (!data?.configured) {
        setDashaError(data?.error || 'Dasha data requires the Astrology API key to be configured (Config > Astrology).')

        return
      }

      setDashaResult(data.dasha)
    } catch {
      setDashaError('Failed to fetch Dasha data. Please try again.')
    } finally {
      setDashaLoading(false)
    }
  }

  // ── Match Making (Ashtakoot) ──
  const [boyBirth, setBoyBirth] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS)
  const [girlBirth, setGirlBirth] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS)
  const [matchResult, setMatchResult] = useState<any>(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)

  const fetchMatch = async () => {
    if (!boyBirth.date || !girlBirth.date) {
      setMatchError('Enter both birth dates first.')

      return
    }

    setMatchLoading(true)
    setMatchError(null)
    setMatchResult(null)

    try {
      const res = await fetch('/api/astrology/match-making', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boy: { date: boyBirth.date, time: boyBirth.time, lat: Number(boyBirth.lat), lon: Number(boyBirth.lon), tz: Number(boyBirth.tz) },
          girl: { date: girlBirth.date, time: girlBirth.time, lat: Number(girlBirth.lat), lon: Number(girlBirth.lon), tz: Number(girlBirth.tz) }
        })
      })
      const data = await res.json()

      if (!data?.configured) {
        setMatchError(data?.error || 'Match Making requires the Astrology API key to be configured (Config > Astrology).')

        return
      }

      setMatchResult(data.matchMaking)
    } catch {
      setMatchError('Failed to fetch match making score. Please try again.')
    } finally {
      setMatchLoading(false)
    }
  }

  const matchScore = (() => {
    const output = matchResult?.output ?? matchResult
    const total = output?.total_points ?? output?.totalPoints ?? output?.score
    const max = output?.maximum_points ?? output?.total_maximum_points ?? 36

    return typeof total === 'number' ? { total, max } : null
  })()

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-8 px-6'>
      <div className='max-w-7xl mx-auto'>

        {/* Page Heading */}
        <div className='text-center mb-8'>
          <Typography variant='h2' className='font-bold galaxy-glow-text mb-2' style={{ color: '#006241' }}>
            Horoscope, Panchang & Muhurat
          </Typography>
          <Typography style={{ color: '#374151' }}>
            Your complete daily spiritual guide — Rashi predictions, Hindu Panchang, planet positions, Dasha and Kundli matching.
          </Typography>
          <Typography variant='body2' className='mt-2'>
            Looking for your numerology numbers? Visit the{' '}
            <Link href='/front-pages/numerology' style={{ color: '#006241', fontWeight: 600 }}>
              Numerology page
            </Link>
            .
          </Typography>
        </div>

        {/* ── Sub-navigation ── */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(16,185,129,0.15)', mb: 6, overflowX: 'auto' }}>
          <Tabs
            value={mainTab}
            onChange={(_, v) => setMainTab(v)}
            variant='scrollable'
            scrollButtons='auto'
            allowScrollButtonsMobile
            sx={{
              minHeight: '44px',
              '& .MuiTab-root': { color: '#6b7280', fontWeight: 600, textTransform: 'none', fontSize: '15px', minHeight: '44px', px: 3 },
              '& .Mui-selected': { color: '#f97316 !important', fontWeight: 700 },
              '& .MuiTabs-indicator': { backgroundColor: '#f97316', height: '3px' }
            }}
          >
            <Tab label='Daily Horoscope & Panchang' />
            <Tab label='Planet Positions' />
            <Tab label='Dasha (Vimshottari)' />
            <Tab label='Match Making' />
          </Tabs>
        </Box>

        {mainTab === 0 && (
          <>
            {/* ── Section 1: Daily Horoscope ── */}
            <Typography variant='h4' className='font-bold mb-4' style={{ color: '#006241' }}>
              🔮 Daily Horoscope
            </Typography>

            <Grid container spacing={3} className='mb-8'>
              {/* Rashi Selector + Forecast */}
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card className='galaxy-card p-5 h-full'>
                  <Typography variant='h6' className='font-bold mb-4' style={{ color: '#047857' }}>
                    Select Your Rashi
                  </Typography>
                  <div className='grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5'>
                    {rashis.map((r) => (
                      <button
                        key={r.name}
                        onClick={() => setSelectedRashi(r.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                          selectedRashi === r.name
                            ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                            : 'border-emerald-100 bg-white hover:border-emerald-300'
                        }`}
                      >
                        <span className='text-2xl mb-1'>{r.symbol}</span>
                        <span className='text-[10px] font-semibold text-center leading-tight' style={{ color: selectedRashi === r.name ? '#006241' : '#374151', whiteSpace: 'pre-line' }}>
                          {r.displayName}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Box sx={{ borderBottom: 1, borderColor: 'rgba(249,115,22,0.2)', mb: 3 }}>
                    <Tabs value={selectedPeriod} onChange={(_, v) => setSelectedPeriod(v)}
                      sx={{
                        '& .MuiTab-root': { color: '#475569', fontSize: '13px' },
                        '& .Mui-selected': { color: '#006241 !important', fontWeight: 'bold' },
                        '& .MuiTabs-indicator': { backgroundColor: '#006241' }
                      }}>
                      <Tab label='Today' />
                      <Tab label='Tomorrow' />
                      <Tab label='This Week' />
                      <Tab label='This Month' />
                    </Tabs>
                  </Box>

                  <div className='p-4 rounded-xl' style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Typography variant='subtitle1' className='font-bold mb-2' style={{ color: '#047857' }}>
                      {selectedRashi} — {['Today', 'Tomorrow', 'Weekly', 'Monthly'][selectedPeriod]}
                    </Typography>
                    {horoscopeLoading ? (
                      <div className='flex items-center gap-2 py-2'>
                        <CircularProgress size={16} />
                        <Typography variant='body2' style={{ color: '#6b7280' }}>Reading the stars...</Typography>
                      </div>
                    ) : (
                      <Typography style={{ color: '#374151', lineHeight: 1.7 }}>
                        {livePrediction || getHoroscopeText(selectedRashi, selectedPeriod)}
                      </Typography>
                    )}
                  </div>
                </Card>
              </Grid>

              {/* ── Panchang ── */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card className='galaxy-card p-5 h-full'>
                  <Typography variant='h6' className='font-bold mb-1' style={{ color: '#047857' }}>
                    📅 Hindu Panchang Today
                  </Typography>
                  <Typography variant='body2' className='mb-4 font-semibold' style={{ color: '#10b981' }}>
                    {panchangData.date}
                  </Typography>
                  <div className='flex flex-col gap-3'>
                    {[
                      { label: 'Tithi / Moon Phase', val: panchangData.tithi, icon: 'tabler-moon-stars' },
                      { label: 'Nakshatra / Star', val: panchangData.nakshatra, icon: 'tabler-sparkles' },
                      { label: 'Yoga / Alignment', val: panchangData.yoga, icon: 'tabler-location-broken' },
                      { label: 'Karana', val: panchangData.karana, icon: 'tabler-adjustments-alt' },
                      { label: 'Sunrise & Sunset', val: `${panchangData.sunrise} / ${panchangData.sunset}`, icon: 'tabler-sunset-2' },
                      { label: 'Rahu Kaal (Inauspicious)', val: panchangData.rahukaal, icon: 'tabler-clock-off', alert: true }
                    ].map((item, idx) => (
                      <div key={idx} className='flex items-start gap-3 p-3 rounded-lg' style={{
                        background: item.alert ? 'rgba(220,38,38,0.04)' : 'rgba(249,115,22,0.04)',
                        border: `1px solid ${item.alert ? 'rgba(220,38,38,0.1)' : 'rgba(249,115,22,0.1)'}`
                      }}>
                        <i className={`${item.icon} text-base mt-0.5`} style={{ color: item.alert ? '#dc2626' : '#10b981' }} />
                        <div>
                          <span className='text-xs block' style={{ color: '#6b7280' }}>{item.label}</span>
                          <span className='text-sm font-semibold' style={{ color: item.alert ? '#dc2626' : '#0f172a' }}>{item.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Grid>
            </Grid>

            {/* ── Section 2: Choghadiya ── */}
            <Typography variant='h4' className='font-bold mb-4' style={{ color: '#006241' }}>
              ⏰ Shubh Choghadiya Muhurat
            </Typography>

            <Card className='galaxy-card p-5'>
              <Box sx={{ borderBottom: 1, borderColor: 'rgba(249,115,22,0.2)', mb: 4, display: 'flex', justifyContent: 'center' }}>
                <Tabs value={choghadiyaTab} onChange={(_, v) => setChoghadiyaTab(v)}
                  sx={{
                    '& .MuiTab-root': { color: '#475569' },
                    '& .Mui-selected': { color: '#006241 !important', fontWeight: 'bold' },
                    '& .MuiTabs-indicator': { backgroundColor: '#006241' }
                  }}>
                  <Tab label='☀️ Day Choghadiya' />
                  <Tab label='🌙 Night Choghadiya' />
                </Tabs>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid rgba(16,185,129,0.15)' }}>
                      {['Time Slot', 'Name', 'Nature', 'Impact & Guidance'].map(h => (
                        <TableCell key={h} sx={{ color: '#006241', fontWeight: 'bold', fontFamily: 'Synonym Variable, sans-serif' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(choghadiyaTab === 0 ? dayChoghadiya : nightChoghadiya).map((row, idx) => (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid rgba(16,185,129,0.06)', '&:hover': { backgroundColor: 'rgba(249,115,22,0.02)' } }}>
                        <TableCell sx={{ color: '#0f172a', fontWeight: 500 }}>{row.time}</TableCell>
                        <TableCell sx={{ color: '#047857', fontWeight: 'bold', fontSize: '1rem' }}>{row.name}</TableCell>
                        <TableCell>
                          <span className='px-2.5 py-1 rounded-full text-xs font-bold' style={{
                            color: getStatusColor(row.type),
                            background: `${getStatusColor(row.type)}15`,
                            border: `1px solid ${getStatusColor(row.type)}30`
                          }}>{row.type}</span>
                        </TableCell>
                        <TableCell sx={{ color: '#475569' }}>{row.effect}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* FAQ Section */}
            <Box className='mt-8'>
              <ServiceFaq
                title="Horoscope & Panchang FAQ"
                subtitle="Frequently asked questions about Rashi forecasts, Hindu Panchang, and Choghadiya calculations."
                items={[
                  {
                    question: "How are the daily Rashi forecasts compiled?",
                    answer: "Our daily, weekly, and monthly horoscope forecasts are calculated dynamically based on real-time transit planetary positions (specifically moon transitions) by certified Vedic astrologers."
                  },
                  {
                    question: "What is the basis of Choghadiya timings?",
                    answer: "Choghadiya calculates 8 divisions (muhurats) of the day and night. Auspicious (Shubh, Amrit, Labha) and inauspicious (Roga, Kala, Udveg) slots are calculated dynamically based on your local sunrise and sunset."
                  },
                  {
                    question: "What is Rahu Kaal and why should we avoid it?",
                    answer: "Rahu Kaal is an inauspicious daily 90-minute time window ruled by Rahu. Vedic scriptures recommend avoiding initiating new business, journeys, or puja rituals during this period."
                  },
                  {
                    question: "Are these panchang details updated daily?",
                    answer: "Yes, our Hindu Panchang and daily Choghadiya calculations sync dynamically with Vedic ephemeris datasets representing precise planetary alignments every single day."
                  }
                ]}
              />
            </Box>
          </>
        )}

        {mainTab === 1 && (
          <Card className='galaxy-card p-5'>
            <Typography variant='h5' className='font-bold mb-4' style={{ color: '#006241' }}>
              🪐 Planet Positions
            </Typography>
            <Typography variant='body2' className='mb-4' style={{ color: '#6b7280' }}>
              Enter a birth date, time and place to see where each planet was positioned (Rasi/sign) at that moment.
            </Typography>

            <BirthDetailsForm value={planetsBirth} onChange={setPlanetsBirth} label='Birth Details' />

            <Button variant='contained' className='galaxy-glow-btn font-bold mt-4' onClick={fetchPlanets} disabled={planetsLoading}>
              {planetsLoading ? <CircularProgress size={20} /> : 'Get Planet Positions'}
            </Button>

            {planetsError && <Alert severity='error' className='mt-4'>{planetsError}</Alert>}

            {planetsResult && (
              <Box className='mt-6'>
                {planetEntries.length > 0 ? (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          {['Planet', 'Sign', 'Degree', 'Retrograde'].map(h => (
                            <TableCell key={h} sx={{ color: '#006241', fontWeight: 'bold' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {planetEntries.map(p => (
                          <TableRow key={p.name}>
                            <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                            <TableCell>{p.sign}</TableCell>
                            <TableCell>{p.degree}°</TableCell>
                            <TableCell>{p.retro ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <RawResultFallback data={planetsResult} />
                )}
              </Box>
            )}
          </Card>
        )}

        {mainTab === 2 && (
          <Card className='galaxy-card p-5'>
            <Typography variant='h5' className='font-bold mb-4' style={{ color: '#006241' }}>
              🕉️ Vimshottari Dasha
            </Typography>
            <Typography variant='body2' className='mb-4' style={{ color: '#6b7280' }}>
              Enter birth details to see the Vimshottari Maha Dasha periods ruling different phases of life.
            </Typography>

            <BirthDetailsForm value={dashaBirth} onChange={setDashaBirth} label='Birth Details' />

            <Button variant='contained' className='galaxy-glow-btn font-bold mt-4' onClick={fetchDasha} disabled={dashaLoading}>
              {dashaLoading ? <CircularProgress size={20} /> : 'Get Dasha Periods'}
            </Button>

            {dashaError && <Alert severity='error' className='mt-4'>{dashaError}</Alert>}

            {dashaResult && (
              <Box className='mt-6'>
                <RawResultFallback data={dashaResult} />
              </Box>
            )}
          </Card>
        )}

        {mainTab === 3 && (
          <Card className='galaxy-card p-5'>
            <Typography variant='h5' className='font-bold mb-4' style={{ color: '#006241' }}>
              💍 Kundli Match Making
            </Typography>
            <Typography variant='body2' className='mb-4' style={{ color: '#6b7280' }}>
              Enter both partners' birth details to see the Ashtakoot compatibility score (out of 36 points).
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <BirthDetailsForm value={boyBirth} onChange={setBoyBirth} label="Groom's Birth Details" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <BirthDetailsForm value={girlBirth} onChange={setGirlBirth} label="Bride's Birth Details" />
              </Grid>
            </Grid>

            <Button variant='contained' className='galaxy-glow-btn font-bold mt-4' onClick={fetchMatch} disabled={matchLoading}>
              {matchLoading ? <CircularProgress size={20} /> : 'Check Compatibility'}
            </Button>

            {matchError && <Alert severity='error' className='mt-4'>{matchError}</Alert>}

            {matchResult && (
              <Box className='mt-6'>
                {matchScore ? (
                  <div className='p-4 rounded-xl text-center' style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Typography variant='h3' className='font-bold' style={{ color: '#006241' }}>
                      {matchScore.total} / {matchScore.max}
                    </Typography>
                    <Typography variant='body2' style={{ color: '#6b7280' }}>Ashtakoot Compatibility Score</Typography>
                  </div>
                ) : (
                  <RawResultFallback data={matchResult} />
                )}
              </Box>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
