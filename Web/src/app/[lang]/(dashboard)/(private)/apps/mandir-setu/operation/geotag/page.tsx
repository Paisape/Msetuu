'use client'

import { useState } from 'react'

import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import GeotagManagerClient from './GeotagManagerClient'
import GeotagTemplesClient from './GeotagTemplesClient'
import GeotagSettingsClient from './GeotagSettingsClient'
import RedemptionSlabsClient from './RedemptionSlabsClient'
import RedemptionRequestsClient from './RedemptionRequestsClient'

const TABS = [
  { label: 'Photo Moderation', Component: GeotagManagerClient },
  { label: 'Known Temples', Component: GeotagTemplesClient },
  { label: 'Points Settings', Component: GeotagSettingsClient },
  { label: 'Redemption Slabs', Component: RedemptionSlabsClient },
  { label: 'Redemption Requests', Component: RedemptionRequestsClient }
]

const Page = () => {
  const [tabIndex, setTabIndex] = useState(0)
  const ActiveTab = TABS[tabIndex].Component

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold text-textPrimary mb-1'>
        Geotag Rewards
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-6'>
        Moderate visitor temple tags, manage known temple locations, set the points-per-tag value, and run the points redemption program.
      </Typography>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} className='mb-6'>
        {TABS.map(t => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>

      <ActiveTab />
    </div>
  )
}

export default Page
