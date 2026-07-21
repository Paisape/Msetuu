'use client'

import { useState, useEffect, useCallback } from 'react'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

type NotificationLog = {
  id: string
  title: string
  message: string
  actionUrl: string | null
  targetAudience: string
  targetEmail: string | null
  channels: string | string[]
  status: string
  stats: string | { emailSent?: number; smsSent?: number; whatsappSent?: number; firebaseSent?: number }
  createdAt: string
}

export default function NotificationsClient() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'CUSTOMERS' | 'SPECIFIC'>('ALL')
  const [targetEmail, setTargetEmail] = useState('')

  // Channels
  const [channelEmail, setChannelEmail] = useState(true)
  const [channelSms, setChannelSms] = useState(true)
  const [channelWhatsapp, setChannelWhatsapp] = useState(true)
  const [channelFirebase, setChannelFirebase] = useState(true)

  const [sending, setSending] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications/history')
      const data = await res.json()
      if (res.ok) {
        setLogs(data)
      } else {
        setError(data?.error || 'Failed to load notification history.')
      }
    } catch {
      setError('Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim() || !message.trim()) {
      setError('Please enter a notification Title and Message.')
      return
    }

    const selectedChannels: string[] = []
    if (channelEmail) selectedChannels.push('email')
    if (channelSms) selectedChannels.push('sms')
    if (channelWhatsapp) selectedChannels.push('whatsapp')
    if (channelFirebase) selectedChannels.push('firebase')

    if (selectedChannels.length === 0) {
      setError('Please select at least one delivery channel (Email, SMS, WhatsApp, or Firebase).')
      return
    }

    if (targetAudience === 'SPECIFIC' && !targetEmail.trim()) {
      setError('Please specify the recipient Email or Phone Number.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          actionUrl: actionUrl.trim() || undefined,
          targetAudience,
          targetEmail: targetAudience === 'SPECIFIC' ? targetEmail.trim() : undefined,
          channels: selectedChannels
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(`Notification broadcast dispatched successfully! Delivery Metrics: Email: ${data.stats.emailSent}, SMS: ${data.stats.smsSent}, WhatsApp: ${data.stats.whatsappSent}, Firebase: ${data.stats.firebaseSent}.`)
        setTitle('')
        setMessage('')
        setActionUrl('')
        setTargetEmail('')
        await loadHistory()
      } else {
        setError(data?.error || 'Failed to dispatch notification broadcast.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send notification.')
    } finally {
      setSending(false)
    }
  }

  const parseChannels = (raw: string | string[]): string[] => {
    if (Array.isArray(raw)) return raw
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  const parseStats = (raw: any) => {
    if (typeof raw === 'object' && raw !== null) return raw
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  return (
    <div className='p-6 flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>
          Multi-Channel Notification Broadcast Center
        </Typography>
        <Typography variant='body2' className='text-textSecondary'>
          Dispatch instant announcements, order updates, and marketing broadcasts across Email, SMS, WhatsApp, and Firebase Push Notifications simultaneously.
        </Typography>
      </div>

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Broadcast Composer Form */}
      <Card>
        <CardHeader title='Compose & Broadcast Notification' subheader='Select your target audience and delivery channels' />
        <CardContent component='form' onSubmit={handleSend} className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <TextField
              label='Notification Title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              fullWidth
              size='small'
              placeholder='e.g. Special Shiva Chadhava & 360° VR Darshan Available!'
            />

            <TextField
              label='Target Audience'
              select
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value as any)}
              fullWidth
              size='small'
            >
              <MenuItem value='ALL'>All Registered Users</MenuItem>
              <MenuItem value='CUSTOMERS'>Customers With Existing Orders</MenuItem>
              <MenuItem value='SPECIFIC'>Specific User (Email or Phone)</MenuItem>
            </TextField>
          </div>

          {targetAudience === 'SPECIFIC' && (
            <TextField
              label='Target Recipient Email or Phone'
              value={targetEmail}
              onChange={e => setTargetEmail(e.target.value)}
              required
              fullWidth
              size='small'
              placeholder='e.g. user@example.com or +919876543210'
            />
          )}

          <TextField
            label='Notification Message Body'
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            multiline
            rows={4}
            fullWidth
            size='small'
            placeholder='Type your message here. Keep it clear and engaging...'
          />

          <TextField
            label='Action Link / URL (Optional)'
            value={actionUrl}
            onChange={e => setActionUrl(e.target.value)}
            fullWidth
            size='small'
            placeholder='https://www.mandirsetuu.com/front-pages/vr/kashi-vishwanath-360'
            helperText='Link opened when recipient clicks the email button or push notification'
          />

          <Typography variant='subtitle2' className='font-semibold mt-2'>
            Select Delivery Channels:
          </Typography>
          <FormGroup row className='gap-4'>
            <FormControlLabel
              control={<Checkbox checked={channelEmail} onChange={e => setChannelEmail(e.target.checked)} color='primary' />}
              label='✉️ Email'
            />
            <FormControlLabel
              control={<Checkbox checked={channelSms} onChange={e => setChannelSms(e.target.checked)} color='info' />}
              label='📱 SMS'
            />
            <FormControlLabel
              control={<Checkbox checked={channelWhatsapp} onChange={e => setChannelWhatsapp(e.target.checked)} color='success' />}
              label='💬 WhatsApp'
            />
            <FormControlLabel
              control={<Checkbox checked={channelFirebase} onChange={e => setChannelFirebase(e.target.checked)} color='warning' />}
              label='🔥 Firebase Push Notification'
            />
          </FormGroup>

          <Box className='mt-2'>
            <Button variant='contained' type='submit' disabled={sending} startIcon={<i className='tabler-send' />}>
              {sending ? <CircularProgress size={18} color='inherit' /> : 'Dispatch Broadcast Now'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* History & Delivery Logs */}
      <Card>
        <CardHeader title='Broadcast Delivery History & Logs' subheader='Recent multi-channel dispatch records' />
        <CardContent>
          {loading ? (
            <div className='p-6 text-center'>
              <CircularProgress size={24} />
            </div>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Notification</TableCell>
                    <TableCell>Target Audience</TableCell>
                    <TableCell>Channels Used</TableCell>
                    <TableCell>Delivery Metrics</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center' className='py-8 text-textSecondary'>
                        No broadcast history yet. Use the composer above to send your first multi-channel notification.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => {
                      const chList = parseChannels(log.channels)
                      const st = parseStats(log.stats)

                      return (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <div>
                              <Typography className='font-semibold text-sm'>{log.title}</Typography>
                              <Typography variant='caption' className='text-textSecondary line-clamp-1'>
                                {log.message}
                              </Typography>
                              {log.actionUrl && (
                                <Typography variant='caption' className='text-primary block font-mono text-[11px] mt-0.5'>
                                  🔗 {log.actionUrl}
                                </Typography>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size='small'
                              label={log.targetAudience === 'SPECIFIC' ? log.targetEmail || 'Specific User' : log.targetAudience}
                              color={log.targetAudience === 'ALL' ? 'primary' : 'default'}
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-wrap gap-1'>
                              {chList.includes('email') && <Chip size='small' label='✉️ Email' color='primary' />}
                              {chList.includes('sms') && <Chip size='small' label='📱 SMS' color='info' />}
                              {chList.includes('whatsapp') && <Chip size='small' label='💬 WhatsApp' color='success' />}
                              {chList.includes('firebase') && <Chip size='small' label='🔥 Push' color='warning' />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-xs space-y-0.5'>
                              {st.emailSent !== undefined && <div>✉️ Email: <strong>{st.emailSent}</strong></div>}
                              {st.smsSent !== undefined && <div>📱 SMS: <strong>{st.smsSent}</strong></div>}
                              {st.whatsappSent !== undefined && <div>💬 WhatsApp: <strong>{st.whatsappSent}</strong></div>}
                              {st.firebaseSent !== undefined && <div>🔥 Firebase: <strong>{st.firebaseSent}</strong></div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' className='text-textSecondary whitespace-nowrap'>
                              {new Date(log.createdAt).toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
