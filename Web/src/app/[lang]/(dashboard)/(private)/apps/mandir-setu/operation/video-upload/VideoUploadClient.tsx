'use client'

import { useState, useEffect, useCallback } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

type Row = { orderType: 'CHADHAVA' | 'EPUJA' | 'CAMPAIGN'; orderId: string; driveLink: string }

type BatchItem = {
  id: string
  orderType: string
  orderId: string
  driveLink: string
  status: 'SUCCESS' | 'FAILED'
  errorReason?: string | null
}

type Batch = {
  id: string
  totalCount: number
  successCount: number
  failedCount: number
  createdAt: string
  createdBy?: { name?: string | null; email?: string | null } | null
  items: BatchItem[]
}

type ContaboUploadItem = {
  id: string
  file: File
  orderId: string
  status: 'PENDING' | 'UPLOADING' | 'SUCCESS' | 'FAILED'
  isUpdate?: boolean
  error?: string
  devoteeName?: string
  smsDispatched?: boolean
}

const emptyRow = (): Row => ({ orderType: 'CHADHAVA', orderId: '', driveLink: '' })

const VideoUploadClient = () => {
  const [activeTab, setActiveTab] = useState<'folder' | 'manual' | 'contabo'>('folder')
  
  // Folder Mode States
  const [folderOrderType, setFolderOrderType] = useState<'CHADHAVA' | 'EPUJA' | 'CAMPAIGN'>('CAMPAIGN')
  const [folderLink, setFolderLink] = useState('')

  // Manual Mode States
  const [rows, setRows] = useState<Row[]>([emptyRow()])

  // Contabo Bulk Upload States
  const [contaboOrderType, setContaboOrderType] = useState<'CHADHAVA' | 'EPUJA' | 'CAMPAIGN'>('CAMPAIGN')
  const [contaboFiles, setContaboFiles] = useState<ContaboUploadItem[]>([])
  const [contaboUploading, setContaboUploading] = useState(false)
  const [contaboSuccessMsg, setContaboSuccessMsg] = useState<string | null>(null)
  
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastBatch, setLastBatch] = useState<Batch | null>(null)
  const [history, setHistory] = useState<Batch[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)

    try {
      const res = await fetch('/api/operation/video-upload')
      const data = await res.json().catch(() => [])

      setHistory(Array.isArray(data) ? data : [])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (idx: number) => setRows(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))

  const handleSubmit = async () => {
    setErrorMsg(null)
    setLastBatch(null)

    let payload: any = {}

    if (activeTab === 'folder') {
      if (!folderLink.trim()) {
        setErrorMsg('Please enter a Google Drive folder link.')
        
return
      }

      payload = {
        mode: 'FOLDER',
        orderType: folderOrderType,
        folderLink: folderLink.trim()
      }
    } else {
      const validRows = rows.filter(r => r.orderId.trim() && r.driveLink.trim())

      if (validRows.length === 0) {
        setErrorMsg('Add at least one row with an Order ID and a Google Drive link.')
        
return
      }

      payload = {
        mode: 'MANUAL',
        items: validRows
      }
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/operation/video-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to process batch.')
      
      setLastBatch(data)
      setRows([emptyRow()])
      setFolderLink('')
      await loadHistory()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to process batch.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectContaboFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    const newItems: ContaboUploadItem[] = selected.map(file => {
      let base = file.name.replace(/\.[^./\\]+$/, '').trim()
      base = base.replace(/^[#\s]*(MS[-_]?|ORD[-_]?)/i, '').trim()
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        orderId: base,
        status: 'PENDING'
      }
    })
    setContaboFiles(prev => [...prev, ...newItems])
    e.target.value = ''
  }

  const handleUpdateContaboOrderId = (idx: number, newOrderId: string) => {
    setContaboFiles(prev => prev.map((item, i) => (i === idx ? { ...item, orderId: newOrderId } : item)))
  }

  const handleRemoveContaboFile = (idx: number) => {
    setContaboFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleClearContaboFiles = () => {
    if (contaboUploading) return
    setContaboFiles([])
    setContaboSuccessMsg(null)
  }

  const handleStartContaboUpload = async () => {
    if (contaboFiles.length === 0 || contaboUploading) return
    setContaboUploading(true)
    setErrorMsg(null)
    setContaboSuccessMsg(null)

    let newUploadsCount = 0
    let updatedUploadsCount = 0
    let failedCount = 0

    for (let i = 0; i < contaboFiles.length; i++) {
      const item = contaboFiles[i]
      if (item.status === 'SUCCESS') continue

      setContaboFiles(prev => prev.map((it, idx) => (idx === i ? { ...it, status: 'UPLOADING' } : it)))

      try {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('orderType', contaboOrderType)
        formData.append('orderId', item.orderId)

        const res = await fetch('/api/operation/video-upload/contabo', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data?.error || 'Upload failed')
        }

        if (data.isUpdate) {
          updatedUploadsCount++
        } else {
          newUploadsCount++
        }

        setContaboFiles(prev =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'SUCCESS',
                  isUpdate: !!data.isUpdate,
                  devoteeName: data.customerName,
                  smsDispatched: !!data.smsDispatched
                }
              : it
          )
        )
      } catch (err: any) {
        failedCount++
        setContaboFiles(prev =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'FAILED',
                  error: err.message || 'Upload failed'
                }
              : it
          )
        )
      }
    }

    setContaboUploading(false)
    const summaryParts: string[] = []
    if (newUploadsCount > 0) summaryParts.push(`${newUploadsCount} new uploads (SMS sent 📱)`)
    if (updatedUploadsCount > 0) summaryParts.push(`${updatedUploadsCount} videos replaced (SMS skipped 🛡️)`)
    if (failedCount > 0) summaryParts.push(`${failedCount} failed`)

    setContaboSuccessMsg(`Batch completed: ${summaryParts.join(' · ') || 'Done'}.`)
    loadHistory()
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-1'>
        Operation — Video Upload
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-6'>
        Attach Google Drive video files to Chadhava or E-Puja orders. The customer is emailed automatically and
        the video link is shown on their order for 48 hours before it's removed.
      </Typography>

      {errorMsg && (
        <Alert severity='error' className='mb-4' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Card className='mb-6'>
        <CardHeader 
          title='Process Videos' 
          action={
            <Tabs 
              value={activeTab} 
              onChange={(_, val) => { setErrorMsg(null); setActiveTab(val) }}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label='Google Drive Folder link' value='folder' />
              <Tab label='Manual Row Entry' value='manual' />
              <Tab label='Bulk Upload (Contabo S3)' value='contabo' />
            </Tabs>
          }
        />
        <CardContent>
          {activeTab === 'folder' ? (
            <div className='flex flex-col gap-4'>
              <Typography variant='body2' className='text-textSecondary'>
                Upload a single Google Drive folder containing video files. The file names should be the Order IDs (e.g. <code>cuid.mp4</code>). The server will scan the folder and automatically map them.
              </Typography>
              <div className='flex gap-3 items-center flex-wrap mt-2'>
                <Select
                  size='small'
                  value={folderOrderType}
                  onChange={e => setFolderOrderType(e.target.value as 'CHADHAVA' | 'EPUJA' | 'CAMPAIGN')}
                  sx={{ minWidth: 170 }}
                >
                  <MenuItem value='CAMPAIGN'>Campaign Category</MenuItem>
                  <MenuItem value='CHADHAVA'>Chadhava Category</MenuItem>
                  <MenuItem value='EPUJA'>E-Puja Category</MenuItem>
                </Select>
                <TextField
                  size='small'
                  placeholder='https://drive.google.com/drive/folders/...'
                  value={folderLink}
                  onChange={e => setFolderLink(e.target.value)}
                  sx={{ minWidth: 400, flex: 1 }}
                />
              </div>
            </div>
          ) : activeTab === 'manual' ? (
            <div className='flex flex-col gap-3'>
              {rows.map((row, idx) => (
                <div key={idx} className='flex gap-2 items-center flex-wrap'>
                  <Select
                    size='small'
                    value={row.orderType}
                    onChange={e => updateRow(idx, { orderType: e.target.value as Row['orderType'] })}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value='CAMPAIGN'>Campaign</MenuItem>
                    <MenuItem value='CHADHAVA'>Chadhava</MenuItem>
                    <MenuItem value='EPUJA'>E-Puja</MenuItem>
                  </Select>
                  <TextField
                    size='small'
                    placeholder='Order ID'
                    value={row.orderId}
                    onChange={e => updateRow(idx, { orderId: e.target.value })}
                    sx={{ minWidth: 220 }}
                  />
                  <TextField
                    size='small'
                    placeholder='https://drive.google.com/file/d/...'
                    value={row.driveLink}
                    onChange={e => updateRow(idx, { driveLink: e.target.value })}
                    sx={{ minWidth: 320, flex: 1 }}
                  />
                  {rows.length > 1 && (
                    <IconButton size='small' onClick={() => removeRow(idx)} aria-label='Remove row'>
                      <i className='tabler-x text-error' />
                    </IconButton>
                  )}
                </div>
              ))}
              <div className='mt-2'>
                <Button size='small' startIcon={<i className='tabler-plus' />} onClick={addRow}>
                  Add Row
                </Button>
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              <Typography variant='body2' className='text-textSecondary'>
                Select multiple video files directly from your computer (e.g. <code>70BA0027.mp4</code>, <code>7EB64E6A.mp4</code>). The system will automatically map each video to its order, upload it to your Contabo S3 bucket (<code>paisape</code>), and send the devotee SMS & Email.
              </Typography>

              {contaboSuccessMsg && (
                <Alert severity='success' onClose={() => setContaboSuccessMsg(null)}>
                  {contaboSuccessMsg}
                </Alert>
              )}

              <div className='flex gap-3 items-center flex-wrap'>
                <Select
                  size='small'
                  value={contaboOrderType}
                  onChange={e => setContaboOrderType(e.target.value as 'CHADHAVA' | 'EPUJA' | 'CAMPAIGN')}
                  disabled={contaboUploading}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value='CAMPAIGN'>Campaign Category</MenuItem>
                  <MenuItem value='CHADHAVA'>Chadhava Category</MenuItem>
                  <MenuItem value='EPUJA'>E-Puja Category</MenuItem>
                </Select>

                <Button
                  variant='outlined'
                  component='label'
                  disabled={contaboUploading}
                  startIcon={<i className='tabler-upload' />}
                >
                  Choose Videos (Select Multiple)
                  <input
                    type='file'
                    hidden
                    multiple
                    accept='video/*,.mp4,.mov,.webm'
                    onChange={handleSelectContaboFiles}
                  />
                </Button>

                {contaboFiles.length > 0 && (
                  <Button
                    size='small'
                    color='secondary'
                    onClick={handleClearContaboFiles}
                    disabled={contaboUploading}
                  >
                    Clear All ({contaboFiles.length})
                  </Button>
                )}
              </div>

              {contaboFiles.length > 0 && (
                <div className='border rounded-xl overflow-hidden mt-2'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>File Size</TableCell>
                        <TableCell>Parsed Order ID</TableCell>
                        <TableCell>Devotee / Status</TableCell>
                        <TableCell align='right'>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contaboFiles.map((item, idx) => (
                        <TableRow key={item.id} hover>
                          <TableCell className='font-mono text-xs max-w-xs truncate'>
                            {item.file.name}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                          </TableCell>
                          <TableCell>
                            <TextField
                              size='small'
                              value={item.orderId}
                              disabled={contaboUploading || item.status === 'SUCCESS'}
                              onChange={e => handleUpdateContaboOrderId(idx, e.target.value)}
                              placeholder='Order ID'
                              sx={{ width: 140 }}
                            />
                          </TableCell>
                          <TableCell>
                            {item.status === 'PENDING' && (
                              <Chip size='small' label='Ready' color='default' variant='outlined' />
                            )}
                            {item.status === 'UPLOADING' && (
                              <div className='flex items-center gap-1.5'>
                                <CircularProgress size={14} />
                                <span className='text-xs text-primary font-semibold'>Uploading & Sending SMS...</span>
                              </div>
                            )}
                            {item.status === 'SUCCESS' && (
                              <div className='flex flex-col gap-0.5'>
                                {item.isUpdate ? (
                                  <>
                                    <Chip size='small' label='Updated 🔄' color='info' variant='outlined' />
                                    <span className='text-[11px] text-blue-700 font-medium'>
                                      {item.devoteeName || 'Devotee'} • Replaced (SMS Skipped 🛡️)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Chip size='small' label='New Upload ✅' color='success' />
                                    <span className='text-[11px] text-green-700 font-medium'>
                                      {item.devoteeName || 'Devotee'} {item.smsDispatched ? '• SMS Sent 📱' : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            {item.status === 'FAILED' && (
                              <div className='flex flex-col gap-0.5'>
                                <Chip size='small' label='Failed' color='error' />
                                <span className='text-[11px] text-red-600'>{item.error || 'Failed'}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            <IconButton
                              size='small'
                              disabled={contaboUploading || item.status === 'SUCCESS'}
                              onClick={() => handleRemoveContaboFile(idx)}
                            >
                              <i className='tabler-x text-error' />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {contaboFiles.length > 0 && (
                <Box className='flex items-center gap-3 mt-4'>
                  <Button
                    variant='contained'
                    onClick={handleStartContaboUpload}
                    disabled={contaboUploading}
                    className='galaxy-glow-btn'
                    startIcon={contaboUploading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-rocket' />}
                  >
                    {contaboUploading
                      ? 'Uploading & Sending SMS...'
                      : `Upload All to Contabo & Send SMS (${contaboFiles.filter(f => f.status !== 'SUCCESS').length})`}
                  </Button>
                </Box>
              )}
            </div>
          )}

          {activeTab !== 'contabo' && (
            <Box className='flex items-center gap-3 mt-6'>
              <Button variant='contained' onClick={handleSubmit} disabled={submitting} className='galaxy-glow-btn'>
                {submitting ? <CircularProgress size={18} color='inherit' /> : activeTab === 'folder' ? 'Scan & Map Folder' : 'Process Batch'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {lastBatch && (
        <Card className='mb-6'>
          <CardHeader
            title='Latest Batch Report'
            subheader={`${lastBatch.successCount} succeeded · ${lastBatch.failedCount} failed · ${lastBatch.totalCount} total`}
          />
          <CardContent>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Order Type</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lastBatch.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.orderType}</TableCell>
                    <TableCell>{item.orderId}</TableCell>
                    <TableCell>
                      <Chip size='small' label={item.status} color={item.status === 'SUCCESS' ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>{item.errorReason || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title='Batch History' />
        <CardContent>
          {historyLoading ? (
            <div className='p-6 text-center'>
              <CircularProgress size={22} />
            </div>
          ) : history.length === 0 ? (
            <Typography className='text-textSecondary'>No batches processed yet.</Typography>
          ) : (
            <div className='flex flex-col gap-2'>
              {history.map(batch => (
                <div key={batch.id}>
                  <div
                    className='flex items-center justify-between gap-3 p-3 rounded cursor-pointer'
                    style={{ background: 'rgba(0,0,0,0.02)' }}
                    onClick={() => setExpandedId(expandedId === batch.id ? null : batch.id)}
                  >
                    <div>
                      <Typography variant='body2' className='font-medium'>
                        {new Date(batch.createdAt).toLocaleString('en-IN')} · {batch.createdBy?.name || batch.createdBy?.email || 'Admin'}
                      </Typography>
                      <Typography variant='caption' className='text-textSecondary'>
                        {batch.totalCount} rows
                      </Typography>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Chip size='small' label={`${batch.successCount} success`} color='success' />
                      {batch.failedCount > 0 && <Chip size='small' label={`${batch.failedCount} failed`} color='error' />}
                    </div>
                  </div>
                  {expandedId === batch.id && (
                    <div className='px-3 pb-3'>
                      <Divider className='mb-2' />
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Order Type</TableCell>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batch.items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.orderType}</TableCell>
                              <TableCell>{item.orderId}</TableCell>
                              <TableCell>
                                <Chip size='small' label={item.status} color={item.status === 'SUCCESS' ? 'success' : 'error'} />
                              </TableCell>
                              <TableCell>{item.errorReason || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default VideoUploadClient
