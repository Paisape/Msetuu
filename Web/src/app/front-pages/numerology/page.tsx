'use client'

import { useState } from 'react'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import ServiceFaq from '@/components/ServiceFaq'

// Short, generic meanings for each numerology number (1-9, plus Master Numbers 11/22/33) shown
// alongside the calculated result — purely reference/descriptive text, not personalized advice.
const NUMBER_MEANINGS: Record<number, string> = {
  1: 'Leadership, independence and originality. Natural pioneers who prefer to forge their own path.',
  2: 'Cooperation, diplomacy and sensitivity. Natural peacemakers who thrive in partnerships.',
  3: 'Creativity, self-expression and optimism. Gifted communicators with an artistic streak.',
  4: 'Stability, discipline and hard work. Reliable builders who value order and structure.',
  5: 'Freedom, adventure and adaptability. Energetic spirits who embrace change.',
  6: 'Responsibility, nurturing and harmony. Natural caregivers devoted to home and community.',
  7: 'Introspection, wisdom and spirituality. Deep thinkers drawn to knowledge and truth.',
  8: 'Ambition, authority and material success. Natural achievers with strong business instincts.',
  9: 'Compassion, idealism and humanitarianism. Old souls driven to serve the greater good.',
  11: 'Master Number — intuition and inspiration. Highly sensitive visionaries with spiritual insight.',
  22: 'Master Number — the "Master Builder". Practical idealists capable of turning big dreams into reality.',
  33: 'Master Number — the "Master Teacher". Selfless nurturers devoted to uplifting others.'
}

type NumerologyResult = {
  lifePathNumber: number
  birthdayNumber: number
  destinyNumber: number
  soulUrgeNumber: number
  personalityNumber: number
}

const RESULT_LABELS: { key: keyof NumerologyResult; label: string; description: string }[] = [
  { key: 'lifePathNumber', label: 'Life Path Number', description: 'The core of your numerology chart — your life\'s overall direction, from your full birth date.' },
  { key: 'birthdayNumber', label: 'Birthday Number', description: 'A special talent you bring into this life, from the day of the month you were born.' },
  { key: 'destinyNumber', label: 'Destiny / Expression Number', description: 'Your natural abilities and goals, calculated from every letter in your full name.' },
  { key: 'soulUrgeNumber', label: 'Soul Urge Number', description: 'Your inner desires and motivations, from the vowels in your name.' },
  { key: 'personalityNumber', label: 'Personality Number', description: 'How others perceive you, from the consonants in your name.' }
]

const NumerologyPage = () => {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [result, setResult] = useState<NumerologyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async () => {
    if (!name.trim()) {
      setError('Enter your full name.')

      return
    }

    if (!dob) {
      setError('Enter your date of birth.')

      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/numerology?name=${encodeURIComponent(name.trim())}&dob=${encodeURIComponent(dob)}`)
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to calculate numerology.')

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate numerology.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-8 px-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-8'>
          <Typography variant='h2' className='font-bold galaxy-glow-text mb-2' style={{ color: '#006241' }}>
            Numerology Calculator
          </Typography>
          <Typography style={{ color: '#374151' }}>
            Enter your full name and date of birth to instantly reveal your core numerology numbers.
          </Typography>
        </div>

        <Card className='galaxy-card p-5 md:p-8 mb-8'>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                fullWidth
                label='Full Name (as given at birth)'
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                type='date'
                label='Date of Birth'
                InputLabelProps={{ shrink: true }}
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </Grid>
          </Grid>

          <Button variant='contained' className='galaxy-glow-btn font-bold mt-5' onClick={handleCalculate} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Calculate My Numbers'}
          </Button>

          {error && <Alert severity='error' className='mt-4'>{error}</Alert>}
        </Card>

        {result && (
          <div className='flex flex-col gap-4 mb-8'>
            {RESULT_LABELS.map(({ key, label, description }) => {
              const value = result[key]

              return (
                <Card key={key} className='galaxy-card p-5 flex items-center gap-5' style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div
                    className='flex items-center justify-center rounded-full font-bold shrink-0'
                    style={{ width: 64, height: 64, fontSize: '28px', background: 'rgba(16,185,129,0.08)', color: '#006241', border: '2px solid rgba(16,185,129,0.25)' }}
                  >
                    {value}
                  </div>
                  <div>
                    <Typography variant='subtitle1' className='font-bold' style={{ color: '#047857' }}>
                      {label}
                    </Typography>
                    <Typography variant='body2' className='mb-1' style={{ color: '#6b7280' }}>
                      {description}
                    </Typography>
                    <Typography variant='body2' style={{ color: '#374151' }}>
                      {NUMBER_MEANINGS[value] || ''}
                    </Typography>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <ServiceFaq
          title='Numerology FAQ'
          subtitle='Frequently asked questions about how these numbers are calculated.'
          items={[
            {
              question: 'How is the Life Path Number calculated?',
              answer: 'It is derived by reducing the day, month, and year of your birth date each to a single digit (or Master Number 11/22/33) and summing them, then reducing again.'
            },
            {
              question: 'What is a Master Number?',
              answer: 'Master Numbers (11, 22, 33) are considered especially significant in numerology and are traditionally not reduced further to a single digit.'
            },
            {
              question: 'Why does my name matter for these calculations?',
              answer: 'The Destiny, Soul Urge, and Personality numbers use the Pythagorean letter-to-number system applied to your full birth name.'
            },
            {
              question: 'Is this data stored anywhere?',
              answer: 'No — calculations happen instantly and are not saved to any account or order history.'
            }
          ]}
        />
      </div>
    </div>
  )
}

export default NumerologyPage
