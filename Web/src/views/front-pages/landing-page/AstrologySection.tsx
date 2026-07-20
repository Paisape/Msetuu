'use client'

import Link from 'next/link'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'

const HIGHLIGHTS = [
  { icon: 'tabler-moon-stars', title: 'Vedic Astrology', desc: 'In-depth birth chart analysis and life guidance rooted in classical Vedic principles.' },
  { icon: 'tabler-heart-handshake', title: 'Love & Relationships', desc: 'Compatibility, Kundli Milan, and remedies for a harmonious married life.' },
  { icon: 'tabler-briefcase', title: 'Career & Finance', desc: 'Guidance on career decisions, business timing, and financial growth.' }
]

const AstrologySection = () => {
  return (
    <section id='home-astrology' className='py-8 px-6 max-w-7xl mx-auto'>
      <div className='text-center mb-10'>
        <Typography variant='h2' className='font-bold mb-4 galaxy-glow-text' style={{ color: '#006241' }}>
          Consult a Verified Astrologer
        </Typography>
        <Typography variant='body1' style={{ color: '#374151' }} className='max-w-2xl mx-auto'>
          Get personal, one-on-one guidance for Career, Love, Finance, and Health from our experienced Vedic
          Astrologers — book your consultation slot in just a few minutes.
        </Typography>
      </div>

      <Grid container spacing={4} className='mb-10'>
        {HIGHLIGHTS.map((h, index) => (
          <Grid size={{ xs: 12, sm: 4, md: 4 }} key={index}>
            <Card className='galaxy-card h-full p-6 text-center'>
              <i className={`${h.icon} text-4xl mb-4`} style={{ color: '#006241' }} />
              <Typography variant='h6' className='font-bold mb-2' style={{ color: '#047857' }}>
                {h.title}
              </Typography>
              <Typography variant='body2' style={{ color: '#6b7280' }}>
                {h.desc}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <div className='text-center'>
        <Button component={Link} href='/front-pages/jyotish' className='galaxy-glow-btn font-bold px-8'>
          Book Your Consultation
        </Button>
      </div>
    </section>
  )
}

export default AstrologySection
