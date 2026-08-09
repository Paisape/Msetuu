'use client'

import { useState, useEffect, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

type SmsTemplate = {
  id: string
  name: string
  templateId: string
  content: string
  senderId?: string | null
  active: boolean
  isDefault: boolean
  createdAt: string
}

export default function SmsTemplatesClient() {
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<SmsTemplate> | null>(null)
  const [saving, setSaving] = useState(false)

  // Test SMS Dialog
  const [openTestDialog, setOpenTestDialog] = useState(false)
  const [testMobile, setTestMobile] = useState('')
  const [testOtp, setTestOtp] = useState('123456')
  const [testTemplateId, setTestTemplateId] = useState('1177178593496518428')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<any | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/sms-templates')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch SMS templates.')
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleOpenCreate = () => {
    setEditingTemplate({
      name: '',
      templateId: '',
      content: '',
      senderId: '',
      active: true,
      isDefault: false
    })
    setOpenDialog(true)
  }

  const handleOpenEdit = (tpl: SmsTemplate) => {
    setEditingTemplate({ ...tpl })
    setOpenDialog(true)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate?.templateId || !editingTemplate?.content) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/sms-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save SMS template.')

      setSuccess('SMS Template saved successfully.')
      setOpenDialog(false)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMS template?')) return

    try {
      const res = await fetch(`/api/admin/sms-templates?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete template.')

      setSuccess('Template deleted successfully.')
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template.')
    }
  }

  const handleSendTestSms = async () => {
    if (!testMobile) {
      setError('Mobile number is required.')
      return
    }

    setSendingTest(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/sms-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_SEND',
          mobile: testMobile,
          otp: testOtp,
          templateId: testTemplateId
        })
      })

      const data = await res.json()
      setTestResult(data)
      if (data.success) {
        setSuccess('Test SMS dispatched successfully!')
      } else {
        setError(data.message || 'Test SMS failed.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test SMS.')
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className='flex flex-col gap-6 p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>DLT SMS Templates Master</h1>
          <p className='text-sm text-gray-500'>
            Manage registered DLT templates for Textzi SMS Gateway & OTP delivery
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={<i className='tabler-send' />}
            onClick={() => setOpenTestDialog(true)}
          >
            Test SMS Dispatch
          </Button>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={handleOpenCreate}
          >
            Add New DLT Template
          </Button>
        </div>
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

      {/* Overview Info Banner */}
      <Card variant='outlined' className='bg-primary/5 border-primary/20'>
        <CardContent className='flex flex-col gap-2'>
          <div className='flex items-center gap-2 font-semibold text-primary'>
            <i className='tabler-info-circle text-lg' />
            Paisape DLT Gateway Configuration (Textzi)
          </div>
          <p className='text-sm text-gray-600'>
            Default OTP Template ID: <strong>1177178593496518428</strong> (Paisape Account Verification).
            Runtime variables like <code>{'{#num#}'}</code> will automatically be replaced with real 6-digit OTP codes when calling <code>send_otp_sms($mobile, $otp)</code>.
          </p>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader title='Registered DLT Templates' subheader='Master template catalog for Textzi SMS integration' />
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
                    <TableCell>Template Name</TableCell>
                    <TableCell>DLT Template ID</TableCell>
                    <TableCell>Content / Message Format</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map(tpl => (
                    <TableRow key={tpl.id}>
                      <TableCell className='font-medium'>
                        {tpl.name}
                        {tpl.isDefault && (
                          <Chip label='Default OTP' size='small' color='primary' className='ml-2 text-xs' />
                        )}
                      </TableCell>
                      <TableCell>
                        <code className='px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm'>
                          {tpl.templateId}
                        </code>
                      </TableCell>
                      <TableCell className='max-w-md text-sm text-gray-700 dark:text-gray-300'>
                        {tpl.content}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tpl.active ? 'Active' : 'Inactive'}
                          color={tpl.active ? 'success' : 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <div className='flex justify-end gap-1'>
                          <Tooltip title='Edit Template'>
                            <IconButton size='small' onClick={() => handleOpenEdit(tpl)}>
                              <i className='tabler-edit text-base' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Test Dispatch'>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={() => {
                                setTestTemplateId(tpl.templateId)
                                setOpenTestDialog(true)
                              }}
                            >
                              <i className='tabler-send text-base' />
                            </IconButton>
                          </Tooltip>
                          {!tpl.isDefault && (
                            <Tooltip title='Delete'>
                              <IconButton size='small' color='error' onClick={() => handleDelete(tpl.id)}>
                                <i className='tabler-trash text-base' />
                              </IconButton>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-6 text-gray-500'>
                        No DLT templates found. Click &quot;Add New DLT Template&quot; to add one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingTemplate?.id ? 'Edit DLT SMS Template' : 'Add New DLT SMS Template'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 mt-2'>
          <TextField
            label='Template Name'
            placeholder='e.g. Paisape OTP Verification'
            value={editingTemplate?.name || ''}
            onChange={e => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label='DLT Template ID'
            placeholder='e.g. 1177178593496518428'
            value={editingTemplate?.templateId || ''}
            onChange={e => setEditingTemplate(prev => ({ ...prev, templateId: e.target.value }))}
            fullWidth
            required
            helperText='Exact DLT Template ID approved on DLT Telecom portal'
          />
          <TextField
            label='Template Content'
            multiline
            rows={4}
            placeholder='Welcome to Paisape. Use OTP {#num#} to verify your Paisape account...'
            value={editingTemplate?.content || ''}
            onChange={e => setEditingTemplate(prev => ({ ...prev, content: e.target.value }))}
            fullWidth
            required
            helperText='Use {#num#} for OTP or custom {#var#} for dynamic values'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveTemplate} disabled={saving}>
            {saving ? <CircularProgress size={20} color='inherit' /> : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test SMS Dispatch Dialog */}
      <Dialog open={openTestDialog} onClose={() => setOpenTestDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Test Textzi SMS Dispatch</DialogTitle>
        <DialogContent className='flex flex-col gap-4 mt-2'>
          <Alert severity='info'>
            Test sending via GET <code>https://api.textzi.in/v1/sms/send-url</code> using configured Textzi API credentials.
          </Alert>
          <TextField
            label='Recipient Mobile Number'
            placeholder='9876543210 or 919876543210'
            value={testMobile}
            onChange={e => setTestMobile(e.target.value)}
            fullWidth
            required
            helperText='10-digit mobile number (automatically formatted with country code 91)'
          />
          <TextField
            label='DLT Template ID'
            value={testTemplateId}
            onChange={e => setTestTemplateId(e.target.value)}
            fullWidth
          />
          <TextField
            label='Test OTP Code'
            value={testOtp}
            onChange={e => setTestOtp(e.target.value)}
            fullWidth
            helperText='Replaces {#num#} in template content'
          />

          {testResult && (
            <div className='p-3 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs overflow-auto max-h-40'>
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestDialog(false)}>Close</Button>
          <Button variant='contained' color='primary' onClick={handleSendTestSms} disabled={sendingTest}>
            {sendingTest ? <CircularProgress size={20} color='inherit' /> : 'Send Test SMS'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
