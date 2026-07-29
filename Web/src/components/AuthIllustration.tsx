'use client'

import React from 'react'
import { Typography, Box, useTheme, Card, CardContent } from '@mui/material'
import classnames from 'classnames'

const steps = [
  {
    icon: 'tabler-search',
    title: 'Explore Temples & Services',
    description: 'Discover temples and their divine services across the country.'
  },
  {
    icon: 'tabler-shopping-cart',
    title: 'Book ePuja & Chadhava',
    description: 'Easily book rituals, prasad, or make donations from anywhere.'
  },
  {
    icon: 'tabler-video',
    title: 'Live Darshan & VR',
    description: 'Immerse yourself with live streams and 360° virtual reality.'
  }
]

const AuthIllustration = () => {
  const theme = useTheme()

  return (
    <Box className='flex flex-col items-center justify-center p-8 lg:p-12 max-w-2xl text-center z-10 w-full'>
      <Typography variant='h3' color='primary.main' className='mb-8 font-bold'>
        How Mandir setuu Works
      </Typography>
      
      <Box className='flex flex-col gap-6 w-full'>
        {steps.map((step, index) => (
          <Card key={index} elevation={theme.palette.mode === 'dark' ? 8 : 2} className='rounded-xl border-none shadow-md transition-transform hover:-translate-y-1 bg-backgroundPaper bg-opacity-90 backdrop-blur-sm'>
            <CardContent className='flex items-center gap-6 p-6 pb-6'>
              <Box 
                className='flex items-center justify-center rounded-full p-4 shrink-0' 
                sx={{ backgroundColor: 'var(--mui-palette-primary-lightOpacity)' }}
              >
                <i className={classnames(step.icon, 'text-4xl text-primary')} />
              </Box>
              <Box className='text-left'>
                <Typography variant='h5' className='mb-1 font-semibold'>
                  {step.title}
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                  {step.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default AuthIllustration
