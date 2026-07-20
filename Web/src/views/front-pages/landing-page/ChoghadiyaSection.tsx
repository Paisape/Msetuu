'use client'

import { useState, useEffect } from 'react'

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

const ChoghadiyaSection = () => {
  const [tabValue, setTabValue] = useState(0) // 0: Day Choghadiya, 1: Night Choghadiya

  const dayChoghadiya = [
    { time: '06:00 AM - 07:30 AM', name: 'Amrit', type: 'Auspicious', effect: 'Best for starting any new spiritual activity or yatra.' },
    { time: '07:30 AM - 09:00 AM', name: 'Kala', type: 'Inauspicious', effect: 'Avoid initiating financial deals or travel.' },
    { time: '09:00 AM - 10:30 AM', name: 'Shubh', type: 'Auspicious', effect: 'Excellent for educational steps, exams, and job interviews.' },
    { time: '10:30 AM - 12:00 PM', name: 'Roga', type: 'Inauspicious', effect: 'Prone to health hazards or litigation. Postpone actions.' },
    { time: '12:00 PM - 01:30 PM', name: 'Udveg', type: 'Inauspicious', effect: 'Brings worry and stress. Refrain from domestic arguments.' },
    { time: '01:30 PM - 03:00 PM', name: 'Chala', type: 'Neutral', effect: 'Normal energies. Good for routine jobs or accounting.' },
    { time: '03:00 PM - 04:30 PM', name: 'Labha', type: 'Auspicious', effect: 'Brings gain and income. Great for retail and merchant opening.' },
    { time: '04:30 PM - 06:00 PM', name: 'Amrit', type: 'Auspicious', effect: 'Pure blessing time. Offer Pujas or spend time with family.' }
  ]

  const nightChoghadiya = [
    { time: '06:00 PM - 07:30 PM', name: 'Chala', type: 'Neutral', effect: 'Good for simple travels or closing shop.' },
    { time: '07:30 PM - 09:00 PM', name: 'Roga', type: 'Inauspicious', effect: 'Avoid medical surgeries or intense debates.' },
    { time: '09:00 PM - 10:30 PM', name: 'Kala', type: 'Inauspicious', effect: 'Restrict outdoor travels. Keep protection amulets.' },
    { time: '10:30 PM - 12:00 AM', name: 'Labha', type: 'Auspicious', effect: 'Attracts dream insights. Good for night rituals.' },
    { time: '12:00 AM - 01:30 AM', name: 'Udveg', type: 'Inauspicious', effect: 'Restless mind state. Recite mantras.' },
    { time: '01:30 AM - 03:00 AM', name: 'Shubh', type: 'Auspicious', effect: 'Blessed sleep. High spiritual protection.' },
    { time: '03:00 AM - 04:30 AM', name: 'Amrit', type: 'Auspicious', effect: 'Brahma Muhurta. Excellent for meditation and yogic breathing.' },
    { time: '04:30 AM - 06:00 AM', name: 'Chala', type: 'Neutral', effect: 'Routine morning duties.' }
  ]

  type ChoghadiyaRow = { time: string; name: string; type: string; effect: string }

  // ── Live Choghadiya — falls back to the static reference tables above if the Astrology API
  // key isn't configured yet, or the upstream response doesn't include fields this widget
  // recognizes (the exact JSON shape of freeastrologyapi.com's choghadiya-timings endpoint isn't
  // guaranteed stable, same caveat as the Panchang widget elsewhere in this app). ──
  const [liveDay, setLiveDay] = useState<ChoghadiyaRow[] | null>(null)
  const [liveNight, setLiveNight] = useState<ChoghadiyaRow[] | null>(null)

  useEffect(() => {
    fetch('/api/choghadiya')
      .then(res => res.json())
      .then(data => {
        if (!data?.configured) return

        const periods = data.output?.[1] ?? data.output ?? data.data ?? data.periods

        if (!Array.isArray(periods)) return

        const parsed: ChoghadiyaRow[] = periods
          .map((p: any) => {
            const start = p.start_time || p.startTime || p.start || ''
            const end = p.end_time || p.endTime || p.end || ''
            const name = p.name || p.choghadiya_name || p.choghadiyaName || ''
            const nature = (p.nature || p.type || '').toLowerCase()

            if (!start || !end || !name) return null

            const type = nature.includes('good') || nature.includes('auspicious') ? 'Auspicious'
              : nature.includes('bad') || nature.includes('inauspicious') ? 'Inauspicious' : 'Neutral'

            return { time: `${start} - ${end}`, name, type, effect: p.description || p.effect || '' }
          })
          .filter((r: ChoghadiyaRow | null): r is ChoghadiyaRow => r !== null)

        if (parsed.length === 0) return

        // First half of the day's periods are daytime, second half nighttime — matches how this
        // provider's Choghadiya sequence is conventionally ordered (sunrise-to-sunset, then
        // sunset-to-sunrise), 8 periods total.
        const midpoint = Math.ceil(parsed.length / 2)

        setLiveDay(parsed.slice(0, midpoint))
        setLiveNight(parsed.slice(midpoint))
      })
      .catch(() => {
        // Keep the static fallback tables on error
      })
  }, [])

  const currentChoghadiyaList = (tabValue === 0 ? liveDay ?? dayChoghadiya : liveNight ?? nightChoghadiya)

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'Auspicious':
        return '#16a34a' // Green for light theme
      case 'Inauspicious':
        return '#dc2626' // Red for light theme
      default:
        return '#64748b' // Slate for light theme
    }
  }

  return (
    <section id='home-choghadiya' className='py-8 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-6'>
        <Typography variant='h2' className='font-bold mb-4 galaxy-glow-text' style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#006241' }}>
          Shubh Choghadiya Muhurat
        </Typography>
        <Typography variant='body1' className='text-slate-500 max-w-2xl mx-auto'>
          Find out the current auspicious hours of the day and night to schedule your important deeds.
        </Typography>
      </div>

      <Grid container spacing={4} justifyContent='center'>
        <Grid size={{ xs: 12, md: 10 }}  >
          <Card className='galaxy-card p-6 bg-white/80 border border-sky-100 rounded-2xl shadow-sm'>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 6, display: 'flex', justifyContent: 'center' }}>
              <Tabs
                value={tabValue}
                onChange={(_, val) => setTabValue(val)}
                textColor='inherit'
                sx={{
                  '& .MuiTab-root': { color: '#475569', fontWeight: 'medium' },
                  '& .Mui-selected': { color: '#0284c7 !important', fontWeight: 'bold' },
                  '& .MuiTabs-indicator': { backgroundColor: '#0284c7' }
                }}
              >
                <Tab label='☀️ Day Choghadiya' className='text-lg px-6' />
                <Tab label='🌙 Night Choghadiya' className='text-lg px-6' />
              </Tabs>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid rgba(2, 132, 199, 0.15)' }}>
                    <TableCell sx={{ color: '#0284c7', fontWeight: 'bold' }}>Time Slot</TableCell>
                    <TableCell sx={{ color: '#0284c7', fontWeight: 'bold' }}>Choghadiya Name</TableCell>
                    <TableCell sx={{ color: '#0284c7', fontWeight: 'bold' }}>Nature</TableCell>
                    <TableCell sx={{ color: '#0284c7', fontWeight: 'bold' }}>Impact & Guidance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentChoghadiyaList.map((row, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        borderBottom: '1px solid rgba(2, 132, 199, 0.05)',
                        '&:hover': { backgroundColor: 'rgba(2, 132, 199, 0.02)' }
                      }}
                    >
                      <TableCell sx={{ color: '#0f172a', fontWeight: 'medium' }}>{row.time}</TableCell>
                      <TableCell sx={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.1rem' }}>{row.name}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: getStatusColor(row.type) }}>
                        <span className='px-2.5 py-1 rounded-full text-xs font-bold' style={{ backgroundColor: `${getStatusColor(row.type)}15`, border: `1px solid ${getStatusColor(row.type)}30` }}>
                          {row.type}
                        </span>
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{row.effect}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </section>
  )
}

export default ChoghadiyaSection
