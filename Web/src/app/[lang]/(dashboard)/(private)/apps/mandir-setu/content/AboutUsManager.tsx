'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

import type { AboutUsData } from '@/app/api/content/about/route'

export default function AboutUsManager() {
  const [data, setData] = useState<AboutUsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/content/about')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load about content:', err)
        setMessage({ type: 'error', text: 'Failed to load About Us content.' })
        setLoading(false)
      })
  }, [])

  const handleChange = (field: keyof AboutUsData, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handleStatChange = (index: number, field: string, value: string) => {
    if (!data) return
    const updated = [...data.stats]
    updated[index] = { ...updated[index], [field]: value }
    setData({ ...data, stats: updated })
  }

  const handlePillarChange = (index: number, field: string, value: string) => {
    if (!data) return
    const updated = [...data.pillars]
    updated[index] = { ...updated[index], [field]: value }
    setData({ ...data, pillars: updated })
  }

  const handleTeamChange = (index: number, field: string, value: string) => {
    if (!data) return
    const updated = [...data.team]
    updated[index] = { ...updated[index], [field]: value }
    setData({ ...data, team: updated })
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/content/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        throw new Error('Failed to save changes')
      }

      const resData = await res.json()
      setData(resData.data)
      setMessage({ type: 'success', text: 'About Us content updated and published successfully!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save About Us content.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center p-12'>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) return null

  return (
    <Box className='space-y-6'>
      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Hero Header Section */}
      <Card>
        <CardContent className='space-y-4'>
          <Typography variant='h6' className='font-bold text-primary'>
            🌅 Hero Header Banner
          </Typography>
          <TextField
            fullWidth
            label='Hero Main Headline'
            value={data.heroTitle}
            onChange={e => handleChange('heroTitle', e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label='Hero Subtitle'
            value={data.heroSubtitle}
            onChange={e => handleChange('heroSubtitle', e.target.value)}
          />
          <TextField
            fullWidth
            label='Hero Banner Image URL'
            value={data.heroImage}
            onChange={e => handleChange('heroImage', e.target.value)}
            helperText='Direct URL to high-resolution temple background image'
          />
        </CardContent>
      </Card>

      {/* Main Story & Overview */}
      <Card>
        <CardContent className='space-y-4'>
          <Typography variant='h6' className='font-bold text-primary'>
            📖 Sacred Story & Overview
          </Typography>
          <TextField
            fullWidth
            label='Story Section Title'
            value={data.storyTitle}
            onChange={e => handleChange('storyTitle', e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Story Paragraph 1 (Origin & Foundation)'
            value={data.storyParagraph1}
            onChange={e => handleChange('storyParagraph1', e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Story Paragraph 2 (Agama Shastra & Temples)'
            value={data.storyParagraph2}
            onChange={e => handleChange('storyParagraph2', e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Story Paragraph 3 (Technology & Ecosystem)'
            value={data.storyParagraph3}
            onChange={e => handleChange('storyParagraph3', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <Card>
        <CardContent className='space-y-4'>
          <Typography variant='h6' className='font-bold text-primary'>
            🎯 Mission & Vision Statements
          </Typography>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <TextField
                fullWidth
                label='Mission Title'
                value={data.missionTitle}
                onChange={e => handleChange('missionTitle', e.target.value)}
                className='mb-3'
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label='Mission Description'
                value={data.missionDescription}
                onChange={e => handleChange('missionDescription', e.target.value)}
              />
            </div>
            <div>
              <TextField
                fullWidth
                label='Vision Title'
                value={data.visionTitle}
                onChange={e => handleChange('visionTitle', e.target.value)}
                className='mb-3'
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label='Vision Description'
                value={data.visionDescription}
                onChange={e => handleChange('visionDescription', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Statistics */}
      <Card>
        <CardContent className='space-y-4'>
          <Typography variant='h6' className='font-bold text-primary'>
            📊 Impact Statistics
          </Typography>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
            {data.stats.map((stat, idx) => (
              <Card key={idx} variant='outlined' className='p-3 space-y-2'>
                <TextField
                  fullWidth
                  size='small'
                  label='Icon (Emoji)'
                  value={stat.icon}
                  onChange={e => handleStatChange(idx, 'icon', e.target.value)}
                />
                <TextField
                  fullWidth
                  size='small'
                  label='Value (e.g. 150,000+)'
                  value={stat.value}
                  onChange={e => handleStatChange(idx, 'value', e.target.value)}
                />
                <TextField
                  fullWidth
                  size='small'
                  label='Label Description'
                  value={stat.label}
                  onChange={e => handleStatChange(idx, 'label', e.target.value)}
                />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Core Principles / Pillars */}
      <Card>
        <CardContent className='space-y-4'>
          <Typography variant='h6' className='font-bold text-primary'>
            🪷 Core Pillars of Mandir Setu
          </Typography>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {data.pillars.map((pillar, idx) => (
              <Card key={idx} variant='outlined' className='p-4 space-y-2'>
                <Box className='flex gap-2 items-center'>
                  <TextField
                    style={{ width: '80px' }}
                    size='small'
                    label='Icon'
                    value={pillar.icon}
                    onChange={e => handlePillarChange(idx, 'icon', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size='small'
                    label='Pillar Title'
                    value={pillar.title}
                    onChange={e => handlePillarChange(idx, 'title', e.target.value)}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size='small'
                  label='Pillar Description'
                  value={pillar.description}
                  onChange={e => handlePillarChange(idx, 'description', e.target.value)}
                />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leadership & Advisory Board */}
      <Card>
        <CardContent className='space-y-4'>
          <Typography variant='h6' className='font-bold text-primary'>
            👥 Leadership & Spiritual Advisory Board
          </Typography>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {data.team.map((member, idx) => (
              <Card key={idx} variant='outlined' className='p-4 space-y-3'>
                <TextField
                  fullWidth
                  size='small'
                  label='Full Name'
                  value={member.name}
                  onChange={e => handleTeamChange(idx, 'name', e.target.value)}
                />
                <TextField
                  fullWidth
                  size='small'
                  label='Designation / Role'
                  value={member.role}
                  onChange={e => handleTeamChange(idx, 'role', e.target.value)}
                />
                <TextField
                  fullWidth
                  size='small'
                  label='Photo URL'
                  value={member.image}
                  onChange={e => handleTeamChange(idx, 'image', e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size='small'
                  label='Short Bio'
                  value={member.bio}
                  onChange={e => handleTeamChange(idx, 'bio', e.target.value)}
                />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Floating Bar */}
      <Box className='flex justify-end pt-4 sticky bottom-4 z-10'>
        <Button
          variant='contained'
          color='primary'
          size='large'
          disabled={saving}
          onClick={handleSave}
          className='shadow-lg px-8 py-3 font-bold'
        >
          {saving ? 'Publishing Changes...' : '💾 Save & Publish About Us Page'}
        </Button>
      </Box>
    </Box>
  )
}
