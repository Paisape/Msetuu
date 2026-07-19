'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'

export type HowItWorksStepItem = {
  title: string
  description: string
}

type Props = {
  title?: string
  subtitle?: string

  // Which page's steps to load from the backend (Content Management > How It Works). When
  // admin-managed steps exist for this page, they replace `items` entirely; otherwise `items`
  // (the page's built-in defaults) is shown so the section never renders empty before content
  // is configured. Admins add/remove steps simply by adding/deleting rows for this page.
  page: string
  items: HowItWorksStepItem[]
}

// Default 4-step flow shared by every booking-style page unless a page overrides it explicitly.
export const DEFAULT_HOW_IT_WORKS_STEPS: HowItWorksStepItem[] = [
  { title: 'Select', description: 'Choose your Puja, Chadhava, Kundli, product, or service package.' },
  { title: 'Add Your Details', description: 'Enter your name and gotra, along with any family members to be included.' },
  { title: 'Make Payment', description: 'Complete secure payment for your order.' },
  { title: 'Receive Your Video', description: 'Get a video of your package by email — download it within 48 hours of receiving it.' }
]

export default function HowItWorksSection({ title = 'How It Works', subtitle = 'A simple, transparent process from start to finish.', page, items }: Props) {
  const [displaySteps, setDisplaySteps] = useState<HowItWorksStepItem[]>(items)

  useEffect(() => {
    fetch(`/api/how-it-works?page=${encodeURIComponent(page)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDisplaySteps(data.map((s: any) => ({ title: s.title, description: s.description })))
        }
      })
      .catch(() => {
        // Keep the built-in default steps on error
      })
  }, [page])

  if (displaySteps.length === 0) return null

  return (
    <Box sx={{ mt: 8, mb: 4, width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant='h4' className='font-bold mb-2' style={{ color: '#059669' }}>
          {title}
        </Typography>
        <Typography variant='body2' style={{ color: '#4b5563' }}>
          {subtitle}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {displaySteps.map((step, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 12 / Math.min(displaySteps.length, 4) }} key={idx}>
            <Box
              className='galaxy-card h-full'
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid rgba(16,185,129,0.15)',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  mx: 'auto',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #10b981, #059669)'
                }}
              >
                {idx + 1}
              </Box>
              <Typography className='font-bold mb-2' style={{ color: '#047857' }}>
                {step.title}
              </Typography>
              <Typography variant='body2' style={{ color: '#4b5563' }}>
                {step.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
