'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

const HoroscopePanchang = () => {
  const [selectedRashi, setSelectedRashi] = useState('Aries')
  const [selectedPeriod, setSelectedPeriod] = useState(0) // 0: Today, 1: Tomorrow, 2: Week, 3: Month

  const rashis = [
    { name: 'Aries', symbol: '♈' },
    { name: 'Taurus', symbol: '♉' },
    { name: 'Gemini', symbol: '♊' },
    { name: 'Cancer', symbol: '♋' },
    { name: 'Leo', symbol: '♌' },
    { name: 'Virgo', symbol: '♍' },
    { name: 'Libra', symbol: '♎' },
    { name: 'Scorpio', symbol: '♏' },
    { name: 'Sagittarius', symbol: '♐' },
    { name: 'Capricorn', symbol: '♑' },
    { name: 'Aquarius', symbol: '♒' },
    { name: 'Pisces', symbol: '♓' }
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

  const getHoroscopeText = (rashi: string, periodIndex: number) => {
    const list = horoscopeTexts[rashi] || horoscopeTexts['Aries']

    return list[periodIndex] || 'Your stars are aligned. Keep moving with confidence and faith.'
  }

  // ── Live Rashifal — falls back to the static text above if the Astrology API key isn't
  // configured yet, or "This Week" is selected (that provider has no weekly endpoint). ──
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

  // ── Live Panchang — falls back to the static reference data below if the key isn't configured
  // yet, or the upstream response doesn't include a field this widget recognizes. ──
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
    rahukaal: '09:00 AM - 10:30 AM (Avoid new tasks)'
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

  return (
    <section id='home-horoscope' className='py-8 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-6'>
        <Typography variant='h2' className='font-bold mb-4 galaxy-glow-text' style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#059669' }}>
          Daily Horoscope & Panchang
        </Typography>
        <Typography variant='body1' className='text-slate-500 max-w-2xl mx-auto'>
          Check your astronomical projections Rashi-wise and live Hindu Panchang updates.
        </Typography>
      </div>

      <Grid container spacing={4}>
        {/* Rashi & Horoscope Section */}
        <Grid size={{ xs: 12, lg: 7 }}  >
          <Card className='galaxy-card p-6 h-full bg-white/80 border border-sky-100 rounded-2xl shadow-sm'>
            <Typography variant='h5' className='text-slate-800 font-bold mb-6 flex items-center gap-2'>
              <i className='tabler-zodiac text-sky-600 text-2xl' /> Horoscope Readings
            </Typography>

            {/* Rashi grid */}
            <div className='grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6'>
              {rashis.map((r) => (
                <button
                  key={r.name}
                  onClick={() => setSelectedRashi(r.name)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
                    selectedRashi === r.name
                      ? 'bg-sky-500/10 border-sky-400 text-sky-700 shadow-md shadow-sky-500/5'
                      : 'border-sky-500/10 bg-white text-slate-500 hover:border-sky-500/30'
                  }`}
                >
                  <span className='text-2xl mb-1'>{r.symbol}</span>
                  <span className='text-xs font-semibold'>{r.name}</span>
                </button>
              ))}
            </div>

            {/* Period Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs
                value={selectedPeriod}
                onChange={(_, val) => setSelectedPeriod(val)}
                textColor='inherit'
                sx={{
                  '& .MuiTab-root': { color: '#475569' },
                  '& .Mui-selected': { color: '#0ea5e9 !important', fontWeight: 'bold' },
                  '& .MuiTabs-indicator': { backgroundColor: '#0ea5e9' }
                }}
              >
                <Tab label='Today' />
                <Tab label='Tomorrow' />
                <Tab label='This Week' />
                <Tab label='This Month' />
              </Tabs>
            </Box>

            {/* Forecast Content */}
            <div className='p-6 bg-sky-50/40 border border-sky-500/15 rounded-lg min-h-32 flex flex-col justify-center'>
              <Typography variant='h6' className='text-slate-800 font-bold mb-3'>
                {selectedRashi} Forecast ({['Today', 'Tomorrow', 'Weekly', 'Monthly'][selectedPeriod]})
              </Typography>
              {horoscopeLoading ? (
                <div className='flex items-center gap-2 py-2'>
                  <CircularProgress size={16} />
                  <Typography variant='body2' className='text-slate-500'>Reading the stars...</Typography>
                </div>
              ) : (
                <Typography variant='body1' className='text-slate-600 leading-relaxed'>
                  {livePrediction || getHoroscopeText(selectedRashi, selectedPeriod)}
                </Typography>
              )}
            </div>
          </Card>
        </Grid>

        {/* Panchang Section */}
        <Grid size={{ xs: 12, lg: 5 }}  >
          <Card className='galaxy-card p-6 h-full flex flex-col justify-between bg-white/80 border border-sky-100 rounded-2xl shadow-sm'>
            <div>
              <Typography variant='h5' className='text-slate-800 font-bold mb-6 flex items-center gap-2'>
                <i className='tabler-calendar-event text-sky-600 text-2xl' /> Hindu Panchang Today
              </Typography>

              <Typography variant='body2' className='text-sky-600 font-bold mb-6'>
                📅 {panchangData.date}
              </Typography>

              <div className='flex flex-col gap-4'>
                {[
                  { label: 'Tithi / Moon Phase', val: panchangData.tithi, icon: 'tabler-moon-stars' },
                  { label: 'Nakshatra / Star Constellation', val: panchangData.nakshatra, icon: 'tabler-sparkles' },
                  { label: 'Yoga / Cosmic Alignment', val: panchangData.yoga, icon: 'tabler-location-broken' },
                  { label: 'Karana / Half Tithi', val: panchangData.karana, icon: 'tabler-adjustments-alt' },
                  { label: 'Sunrise & Sunset', val: `${panchangData.sunrise} / ${panchangData.sunset}`, icon: 'tabler-sunset-2' },
                  { label: 'Rahu Kaal (Inauspicious Time)', val: panchangData.rahukaal, icon: 'tabler-clock-off', alert: true }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-4 p-3 rounded-lg border ${
                    item.alert ? 'bg-rose-50/50 border-rose-500/10' : 'bg-sky-50/20 border-sky-500/5'
                  }`}>
                    <i className={`${item.icon} text-lg ${item.alert ? 'text-rose-600' : 'text-sky-600'} mt-0.5`} />
                    <div>
                      <span className='text-xs text-slate-500 block'>{item.label}</span>
                      <span className={`text-sm font-semibold ${item.alert ? 'text-rose-700' : 'text-slate-800'}`}>{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Grid>
      </Grid>
    </section>
  )
}

export default HoroscopePanchang
