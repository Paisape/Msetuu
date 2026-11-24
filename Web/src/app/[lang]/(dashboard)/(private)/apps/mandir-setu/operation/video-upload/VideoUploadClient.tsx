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

type StoredGroup = { source: 'contabo' | 'drive'; folder: string; date: string; count: number; totalBytes: number; ageDays: number }

type ReportRow = {
  orderId: string
  shortId: string
  category: string
  name: string
  uploadedAt: string
  deleted: boolean
  downloaded: boolean
  downloadCount: number
  lastDownloadAt: string | null
}

type ScanItem = { file: string; ok: boolean; orderId?: string; customerName?: string; message: string }

const emptyRow = (): Row => ({ orderType: 'CHADHAVA', orderId: '', driveLink: '' })

const VideoUploadClient = () => {
  const [activeTab, setActiveTab] = useState<'folder' | 'manual' | 'contabo' | 'stored' | 'report'>('folder')
  
  // Folder Mode States
  const [folderOrderType, setFolderOrderType] = useState<'CHADHAVA' | 'EPUJA' | 'CAMPAIGN'>('CAMPAIGN')
  const [folderLink, setFolderLink] = useState('')

  // Manual Mode States
  const [rows, setRows] = useState<Row[]>([emptyRow()])

  // Contabo Bulk Upload States
  const [contaboOrderType, setContaboOrderType] = useState<'CHADHAVA' | 'EPUJA' | 'CAMPAIGN'>('CAMPAIGN')
  const [scanFolder, setScanFolder] = useState('videos/campaign/inbox/')
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanItem[] | null>(null)
  const [stored, setStored] = useState<StoredGroup[]>([])
  const [storedLoading, setStoredLoading] = useState(false)
  const [report, setReport] = useState<ReportRow[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportFilter, setReportFilter] = useState<'ALL' | 'NOT' | 'DONE'>('NOT')
  const [deletingId, setDeletingId] = useState<string | null>(null)


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

  const handleScanFolder = async () => {
    if (scanning) return
    setScanning(true)
    setScanResults(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/operation/video-upload/contabo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderType: contaboOrderType, folder: scanFolder })
      })
      const data = await res.json()

      if (!res.ok || !data.success) throw new Error(data?.error || 'Scan failed')

      setScanResults(data.items)
      loadHistory()
    } catch (err: any) {
      setErrorMsg(err.message || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const loadStored = useCallback(async () => {
    setStoredLoading(true)

    try {
      const res = await fetch('/api/operation/video-upload/contabo/batches')
      const data = await res.json()

      if (!res.ok || !data.success) throw new Error(data?.error || 'Could not load stored videos')

      setStored(data.groups)
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load stored videos')
    } finally {
      setStoredLoading(false)
    }
  }, [])

  const loadReport = useCallback(async () => {
    setReportLoading(true)

    try {
      const res = await fetch('/api/operation/video-upload/downloads')
      const data = await res.json()

      if (!res.ok || !data.success) throw new Error(data?.error || 'Could not load the download report')

      setReport(data.items)
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load the download report')
    } finally {
      setReportLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'stored') loadStored()
    if (activeTab === 'report') loadReport()
  }, [activeTab, loadStored, loadReport])

  const handleDeleteBatch = async (group: StoredGroup) => {
    const ok = window.confirm(
      group.source === 'drive'
        ? `Remove ${group.count} Google Drive video links uploaded on ${group.date} from their orders? The files on Drive are not deleted.`
        : `Permanently delete ${group.count} videos from ${group.folder}/ uploaded on ${group.date}? This removes them from storage and cannot be undone.`
    )

    if (!ok) return

    const id = `${group.source}|${group.folder}|${group.date}`

    setDeletingId(id)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/operation/video-upload/contabo/batches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: group.source, folder: group.folder, date: group.date })
      })
      const data = await res.json()

      if (!res.ok || !data.success) throw new Error(data?.error || 'Delete failed')

      await loadStored()
    } catch (err: any) {
      setErrorMsg(err.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='p-6'>
      <Typography variant='h4' className='font-bold mb-1'>
        Operation — Video Upload
      </Typography>
      <Typography variant='body2' className='text-textSecondary mb-6'>
        Attach Google Drive video files to Chadhava or E-Puja orders. The customer is emailed automatically and
        the video stays on their order until it is deleted.
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
              <Tab label='Attach from Contabo Folder' value='contabo' />
              <Tab label='Stored Videos (Delete)' value='stored' />
              <Tab label='Download Report' value='report' />
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
          ) : activeTab === 'contabo' ? (
            <div className='flex flex-col gap-4'>
              <Typography variant='body2' className='text-textSecondary'>
                Upload the videos to a Contabo bucket folder with any S3 tool (e.g. Cyberduck), naming each file by its Order ID
                (e.g. <code>70BA0027.mp4</code> or <code>MS-70BA0027.mov</code>). Then enter the folder here to attach every video to its order.
              </Typography>

              <div className='flex items-center gap-2'>
                <Typography variant='caption' className='font-semibold text-textSecondary uppercase'>
                  Category:
                </Typography>
                <Select
                  size='small'
                  value={contaboOrderType}
                  onChange={e => setContaboOrderType(e.target.value as 'CHADHAVA' | 'EPUJA' | 'CAMPAIGN')}
                  disabled={scanning}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value='CAMPAIGN'>Campaign Category</MenuItem>
                  <MenuItem value='CHADHAVA'>Chadhava Category</MenuItem>
                  <MenuItem value='EPUJA'>E-Puja Category</MenuItem>
                </Select>
              </div>

              <div className='flex gap-2 items-center flex-wrap'>
                <TextField
                  size='small'
                  value={scanFolder}
                  onChange={e => setScanFolder(e.target.value)}
                  disabled={scanning}
                  placeholder='videos/campaign/inbox/'
                  sx={{ minWidth: 320 }}
                />
                <Button variant='contained' disabled={scanning || !scanFolder.trim()} onClick={handleScanFolder}>
                  {scanning ? 'Attaching...' : 'Scan & Attach'}
                </Button>
              </div>

              {scanResults && (
                <div className='flex flex-col gap-0.5 text-xs'>
                  <strong>
                    {scanResults.filter(r => r.ok).length} of {scanResults.length} attached
                  </strong>
                  {scanResults.map(r => (
                    <span key={r.file} className={r.ok ? 'text-green-700' : 'text-red-600'}>
                      {r.file} — {r.customerName ? `${r.customerName}: ` : ''}
                      {r.message}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'report' ? (
            <div className='flex flex-col gap-4'>
              <Typography variant='body2' className='text-textSecondary'>
                Shows whether each customer has downloaded their video. Follow up on "Not downloaded" rows before you delete
                those videos.
              </Typography>

              <div className='flex items-center gap-2 flex-wrap'>
                {(['ALL', 'NOT', 'DONE'] as const).map(f => (
                  <Button key={f} size='small' variant={reportFilter === f ? 'contained' : 'outlined'} onClick={() => setReportFilter(f)}>
                    {f === 'ALL'
                      ? `All (${report.length})`
                      : f === 'NOT'
                        ? `Not downloaded (${report.filter(r => !r.downloaded).length})`
                        : `Downloaded (${report.filter(r => r.downloaded).length})`}
                  </Button>
                ))}
                <Button size='small' onClick={loadReport} disabled={reportLoading}>
                  Refresh
                </Button>
              </div>

              {reportLoading ? (
                <CircularProgress size={24} />
              ) : (
                <div className='border rounded-xl overflow-hidden'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Devotee</TableCell>
                        <TableCell>Uploaded</TableCell>
                        <TableCell>Video</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Download</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report
                        .filter(r => reportFilter === 'ALL' || (reportFilter === 'DONE' ? r.downloaded : !r.downloaded))
                        .map(r => (
                          <TableRow key={r.orderId} hover>
                            <TableCell className='font-mono text-xs'>#MS-{r.shortId}</TableCell>
                            <TableCell>{r.category}</TableCell>
                            <TableCell>{r.name}</TableCell>
                            <TableCell>{new Date(r.uploadedAt).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>{r.deleted ? 'Deleted' : 'Available'}</TableCell>
                            <TableCell>
                              {r.downloaded ? (
                                <span className='text-green-700 font-semibold'>Downloaded ({r.downloadCount})</span>
                              ) : (
                                <span className={r.deleted ? 'text-red-600 font-semibold' : 'text-orange-600 font-semibold'}>Not downloaded</span>
                              )}
                            </TableCell>
                            <TableCell>{r.lastDownloadAt ? new Date(r.lastDownloadAt).toLocaleString('en-IN') : '—'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              <Typography variant='body2' className='text-textSecondary'>
                Every video, grouped by location and upload date. Nothing is deleted automatically — use Delete to remove a whole batch. Google Drive rows only remove the link from the orders.
              </Typography>

              {storedLoading ? (
                <CircularProgress size={24} />
              ) : stored.length === 0 ? (
                <Typography variant='body2'>No videos in storage.</Typography>
              ) : (
                <div className='border rounded-xl overflow-hidden'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Upload Date</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell align='right'>Total Videos</TableCell>
                        <TableCell align='right'>Size</TableCell>
                        <TableCell align='right'>Total Days</TableCell>
                        <TableCell align='right'>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stored.map(g => {
                        const id = `${g.source}|${g.folder}|${g.date}`

                        return (
                          <TableRow key={id} hover>
                            <TableCell>{g.date}</TableCell>
                            <TableCell className='font-mono text-xs'>{g.source === 'drive' ? 'Google Drive' : `Contabo · ${g.folder}/`}</TableCell>
                            <TableCell align='right'>{g.count}</TableCell>
                            <TableCell align='right'>{g.source === 'drive' ? '—' : `${(g.totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`}</TableCell>
                            <TableCell align='right'>{g.ageDays}</TableCell>
                            <TableCell align='right'>
                              <Button
                                size='small'
                                color='error'
                                variant='outlined'
                                disabled={deletingId !== null}
                                onClick={() => handleDeleteBatch(g)}
                              >
                                {deletingId === id ? 'Deleting...' : g.source === 'drive' ? 'Remove link' : 'Delete'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'contabo' && activeTab !== 'stored' && activeTab !== 'report' && (
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
