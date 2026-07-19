'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'

export type FaqItem = {
  question: string
  answer: string
}

type Props = {
  title?: string
  subtitle?: string

  // Which page's FAQs to load from the backend (Content Management > FAQs). When admin-managed
  // FAQs exist for this page, they replace `items` entirely; otherwise `items` (the page's
  // built-in defaults) is shown so the section never renders empty before content is configured.
  page?: string
  items: FaqItem[]
}

export default function ServiceFaq({ title = 'Frequently Asked Questions', subtitle = 'Got questions? We have got answers.', page, items }: Props) {
  const [expanded, setExpanded] = useState<number | false>(0)
  const [displayItems, setDisplayItems] = useState<FaqItem[]>(items)

  useEffect(() => {
    if (!page) return

    fetch(`/api/faqs?page=${encodeURIComponent(page)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDisplayItems(data.map((f: any) => ({ question: f.question, answer: f.answer })))
        }
      })
      .catch(() => {
        // Keep the built-in default items on error
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleChange = (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

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

      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        {displayItems.map((item, idx) => (
          <Accordion
            key={idx}
            expanded={expanded === idx}
            onChange={handleChange(idx)}
            sx={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16, 185, 129, 0.12)',
              borderRadius: '12px !important',
              boxShadow: 'none',
              mb: '12px',
              '&::before': { display: 'none' },
              '&.Mui-expanded': {
                border: '1px solid rgba(16, 185, 129, 0.35)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.06)'
              }
            }}
          >
            <AccordionSummary
              expandIcon={<i className='tabler-chevron-down' style={{ color: '#059669' }} />}
              sx={{
                px: 3,
                py: 0.5,
                '& .MuiAccordionSummary-content': {
                  m: 0
                }
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: expanded === idx ? '#059669' : '#1e293b',
                  transition: 'color 0.2s ease'
                }}
              >
                {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
              <Typography sx={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  )
}
