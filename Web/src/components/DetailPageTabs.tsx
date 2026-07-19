'use client'

import { useState, type ReactNode } from 'react'

import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

export type DetailTab = {
  key: string
  label: string
  content: ReactNode

  // Omit a tab entirely when it has nothing to show yet (e.g. "Temple Details" before an admin
  // has filled in any temple info) — keeps the tab bar from listing empty sections.
  hidden?: boolean
}

type Props = {
  tabs: DetailTab[]
}

// Tabbed detail-page layout (About / Temple Details / Benefits / Process / Packages / Reviews /
// FAQs) shared across Chadhava, E-Puja and Ecommerce detail pages, matching the reference
// booking-site layout the client asked to follow. Active-tab color is orange (#f97316) — an
// existing accent color in the site's palette — over the established green content styling.
const DetailPageTabs = ({ tabs }: Props) => {
  const visibleTabs = tabs.filter(t => !t.hidden)
  const [active, setActive] = useState(visibleTabs[0]?.key || '')

  if (visibleTabs.length === 0) return null

  const activeTab = visibleTabs.find(t => t.key === active) || visibleTabs[0]

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(16,185,129,0.15)', mb: 6, overflowX: 'auto' }}>
        <Tabs
          value={activeTab.key}
          onChange={(_, val) => setActive(val)}
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
          {visibleTabs.map(t => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>
      <Box>{activeTab.content}</Box>
    </Box>
  )
}

export default DetailPageTabs
