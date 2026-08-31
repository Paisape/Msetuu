'use client'

import { useState, useEffect, useCallback } from 'react'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'

type VrMediaItem = {
  id: string
  slug: string
  title: string
  description: string | null
  mediaType: 'VR_360_IMAGE' | 'VR_360_VIDEO' | 'HD_VIDEO'
  mediaUrl: string
  thumbnailUrl: string | null
  active: boolean
  viewsCount: number
  createdAt: string
}

export default function VrHostingClient() {
  const [items, setItems] = useState<VrMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Dialog State (Create / Edit)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<VrMediaItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form Fields
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formMediaType, setFormMediaType] = useState<'VR_360_IMAGE' | 'VR_360_VIDEO' | 'HD_VIDEO'>('VR_360_IMAGE')
  const [formMediaUrl, setFormMediaUrl] = useState('')
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // QR Code Preview Modal State
  const [openQrModal, setOpenQrModal] = useState(false)
  const [selectedQrItem, setSelectedQrItem] = useState<VrMediaItem | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // 3D Tour ZIP Upload Modal State
  const [openZipDialog, setOpenZipDialog] = useState(false)
  const [zipTargetId, setZipTargetId] = useState<string>('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [zipTitle, setZipTitle] = useState('')
  const [zipSlug, setZipSlug] = useState('')
  const [zipDescription, setZipDescription] = useState('')
  const [uploadingZip, setUploadingZip] = useState(false)
  const [zipSuccessMsg, setZipSuccessMsg] = useState<string | null>(null)
  const [zipErrorMsg, setZipErrorMsg] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/vr?includeAll=true')
      const data = await res.json()
      if (res.ok) {
        setItems(data)
      } else {
        setError(data?.error || 'Failed to load VR media items.')
      }
    } catch {
      setError('Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormSlug('')
    setFormDescription('')
    setFormMediaType('VR_360_IMAGE')
    setFormMediaUrl('')
    setFormThumbnailUrl('')
    setFormActive(true)
    setOpenDialog(true)
  }

  const handleOpenEdit = (item: VrMediaItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormSlug(item.slug)
    setFormDescription(item.description || '')
    setFormMediaType(item.mediaType)
    setFormMediaUrl(item.mediaUrl)
    setFormThumbnailUrl(item.thumbnailUrl || '')
    setFormActive(item.active)
    setOpenDialog(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'media' | 'thumbnail') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.url) {
        if (target === 'media') setFormMediaUrl(data.url)
        else setFormThumbnailUrl(data.url)
      } else {
        alert(data?.error || 'File upload failed.')
      }
    } catch {
      alert('File upload failed.')
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleSave = async () => {
    if (!formTitle || !formMediaUrl) {
      alert('Please fill in required fields (Title and Media URL).')
      return
    }

    setSaving(true)
    try {
      const url = editingItem ? `/api/vr/${editingItem.id}` : '/api/vr'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          slug: formSlug,
          description: formDescription,
          mediaType: formMediaType,
          mediaUrl: formMediaUrl,
          thumbnailUrl: formThumbnailUrl,
          active: formActive
        })
      })

      const data = await res.json()
      if (res.ok) {
        setOpenDialog(false)
        await loadItems()
      } else {
        alert(data?.error || 'Failed to save VR media item.')
      }
    } catch {
      alert('Failed to save VR media item.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenReplaceZip = (item: VrMediaItem) => {
    setZipTargetId(item.id)
    setZipFile(null)
    setZipTitle(item.title)
    setZipSlug(item.slug)
    setZipDescription(item.description || '')
    setZipErrorMsg(null)
    setZipSuccessMsg(null)
    setOpenZipDialog(true)
  }

  const handleUploadZip = async () => {
    if (!zipFile) {
      setZipErrorMsg('Please select a 3D Tour .zip file to upload.')
      return
    }

    setUploadingZip(true)
    setZipErrorMsg(null)
    setZipSuccessMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', zipFile)
      if (zipTargetId) formData.append('targetId', zipTargetId)
      if (zipTitle) formData.append('title', zipTitle)
      if (zipSlug) formData.append('slug', zipSlug)
      if (zipDescription) formData.append('description', zipDescription)

      const res = await fetch('/api/vr/upload-tour', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setZipSuccessMsg(`✓ ${data.message}`)
        await loadItems()
        setTimeout(() => {
          setOpenZipDialog(false)
          setZipTargetId('')
          setZipFile(null)
          setZipTitle('')
          setZipSlug('')
          setZipDescription('')
          setZipSuccessMsg(null)
        }, 1500)
      } else {
        setZipErrorMsg(data?.error || 'Failed to upload and extract 3D tour zip.')
      }
    } catch {
      setZipErrorMsg('Network error while uploading 3D tour zip.')
    } finally {
      setUploadingZip(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this VR Media item?')) return

    try {
      const res = await fetch(`/api/vr/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadItems()
      } else {
        const data = await res.json()
        alert(data?.error || 'Failed to delete VR item.')
      }
    } catch {
      alert('Failed to delete VR item.')
    }
  }

  const handleShowQr = (item: VrMediaItem) => {
    setSelectedQrItem(item)
    setCopiedLink(false)
    setOpenQrModal(true)
  }

  const publicUrl = selectedQrItem ? `${typeof window !== 'undefined' ? window.location.origin : ''}/front-pages/vr/${selectedQrItem.slug}` : ''
  const qrApiUrl = publicUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}` : ''

  const copyQrPublicLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }

  const filteredItems = items.filter(
    i => i.title.toLowerCase().includes(search.toLowerCase()) || i.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='p-6 flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <Typography variant='h4' className='font-bold'>
            VR & Video Hosting Management
          </Typography>
          <Typography variant='body2' className='text-textSecondary'>
            Upload and host 360° VR Videos, 360° Panoramic Images, and HD Videos. Auto-generate shareable QR Codes and Links monetized with Google AdSense.
          </Typography>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='contained'
            style={{ backgroundColor: '#FF671F' }}
            className='font-bold text-white shadow-md'
            startIcon={<i className='tabler-file-zip' />}
            onClick={() => {
              setZipFile(null)
              setZipTitle('')
              setZipSlug('')
              setZipDescription('')
              setZipErrorMsg(null)
              setZipSuccessMsg(null)
              setOpenZipDialog(true)
            }}
          >
            Upload 3D Tour (.zip)
          </Button>

          <Button variant='outlined' startIcon={<i className='tabler-plus' />} onClick={handleOpenAdd}>
            Add Single Media
          </Button>
        </div>
      </div>

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title='Hosted VR & Video Library'
          action={
            <TextField
              size='small'
              placeholder='Search by title or slug...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
          }
        />
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
                    <TableCell>Media Item</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Slug / Direct Link</TableCell>
                    <TableCell>Views</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='right'>Actions & QR Code</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center' className='py-8 text-textSecondary'>
                        No VR media items found. Click &quot;Add New VR Media&quot; to upload your first 360° VR experience.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map(item => {
                      const is3dTour = item.mediaUrl.endsWith('.htm') || item.mediaUrl.endsWith('.html') || item.mediaUrl.includes('/tours/')

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt={item.title} className='w-12 h-12 object-cover rounded-lg border shadow-sm' />
                              ) : (
                                <div className='w-12 h-12 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center text-xl'>
                                  {is3dTour ? '🕉️' : item.mediaType === 'VR_360_IMAGE' ? '🥽' : '🎥'}
                                </div>
                              )}
                              <div>
                                <div className='flex items-center gap-2'>
                                  <Typography className='font-semibold text-sm'>{item.title}</Typography>
                                  {is3dTour && (
                                    <span className='px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded'>
                                      3D Tour
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <Typography variant='caption' className='text-textSecondary line-clamp-1'>
                                    {item.description}
                                  </Typography>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size='small'
                              label={is3dTour ? '3D VIRTUAL TOUR' : item.mediaType.replace('_', ' ')}
                              color={is3dTour ? 'warning' : item.mediaType === 'VR_360_IMAGE' ? 'primary' : 'secondary'}
                              variant={is3dTour ? 'filled' : 'outlined'}
                              className='font-bold text-[11px]'
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant='caption' className='font-mono text-xs text-primary'>
                              /front-pages/vr/{item.slug}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' className='font-medium'>
                              👁️ {item.viewsCount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size='small'
                              label={item.active ? 'Active' : 'Inactive'}
                              color={item.active ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <div className='flex items-center justify-end gap-1'>
                              {is3dTour && (
                                <Button
                                  size='small'
                                  variant='contained'
                                  style={{ backgroundColor: '#f97316' }}
                                  className='text-white font-bold'
                                  startIcon={<i className='tabler-refresh' />}
                                  onClick={() => handleOpenReplaceZip(item)}
                                >
                                  Replace .ZIP
                                </Button>
                              )}
                              <Button
                                size='small'
                                variant='outlined'
                                color='info'
                                startIcon={<i className='tabler-qrcode' />}
                                onClick={() => handleShowQr(item)}
                              >
                                QR & Link
                              </Button>
                              <Button
                                size='small'
                                variant='outlined'
                                color='secondary'
                                component='a'
                                href={`/front-pages/vr/${item.slug}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                startIcon={<i className='tabler-external-link' />}
                              >
                                View
                              </Button>
                              <IconButton size='small' color='primary' onClick={() => handleOpenEdit(item)}>
                                <i className='tabler-edit' />
                              </IconButton>
                              <IconButton size='small' color='error' onClick={() => handleDelete(item.id)}>
                                <i className='tabler-trash' />
                              </IconButton>
                            </div>
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

      {/* Add / Edit VR Media Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? 'Edit VR Media' : 'Add New VR Media'}</DialogTitle>
        <DialogContent dividers className='flex flex-col gap-4 pt-4'>
          <TextField
            label='Title'
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            required
            fullWidth
            size='small'
            placeholder='e.g. Kashi Vishwanath 360° Virtual Darshan'
          />

          <TextField
            label='Custom Slug (Optional)'
            value={formSlug}
            onChange={e => setFormSlug(e.target.value)}
            fullWidth
            size='small'
            placeholder='e.g. kashi-vishwanath-360'
            helperText='Leave blank to auto-generate from Title'
          />

          <TextField
            label='Media Type'
            select
            value={formMediaType}
            onChange={e => setFormMediaType(e.target.value as any)}
            fullWidth
            size='small'
          >
            <MenuItem value='VR_360_IMAGE'>VR 360° Image / Panorama</MenuItem>
            <MenuItem value='VR_360_VIDEO'>VR 360° Video</MenuItem>
            <MenuItem value='HD_VIDEO'>HD Virtual Darshan Video</MenuItem>
          </TextField>

          <div className='flex flex-col gap-2'>
            <TextField
              label='Media File URL / Upload'
              value={formMediaUrl}
              onChange={e => setFormMediaUrl(e.target.value)}
              required
              fullWidth
              size='small'
              placeholder='https://... or click Upload button'
            />
            <Button variant='outlined' component='label' size='small' disabled={uploadingMedia}>
              {uploadingMedia ? 'Uploading File...' : '📁 Upload Media File'}
              <input type='file' hidden accept='image/*,video/*' onChange={e => handleFileUpload(e, 'media')} />
            </Button>
          </div>

          <div className='flex flex-col gap-2'>
            <TextField
              label='Thumbnail Image URL / Upload (Optional)'
              value={formThumbnailUrl}
              onChange={e => setFormThumbnailUrl(e.target.value)}
              fullWidth
              size='small'
              placeholder='https://...'
            />
            <Button variant='outlined' component='label' size='small' disabled={uploadingMedia}>
              {uploadingMedia ? 'Uploading Thumbnail...' : '🖼️ Upload Thumbnail Image'}
              <input type='file' hidden accept='image/*' onChange={e => handleFileUpload(e, 'thumbnail')} />
            </Button>
          </div>

          <TextField
            label='Description / Mandir Significance'
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            size='small'
          />

          <FormControlLabel
            control={<Switch checked={formActive} onChange={e => setFormActive(e.target.checked)} />}
            label='Active (Visible to public)'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color='inherit' /> : 'Save VR Media'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code & Share Modal */}
      <Dialog open={openQrModal} onClose={() => setOpenQrModal(false)} maxWidth='xs' fullWidth>
        <DialogTitle className='text-center font-bold'>Share & Scan QR Code</DialogTitle>
        <DialogContent className='flex flex-col items-center text-center gap-4 py-4'>
          {selectedQrItem && (
            <>
              <Typography variant='subtitle1' className='font-semibold'>
                {selectedQrItem.title}
              </Typography>

              {qrApiUrl && (
                <div className='bg-white p-3 border rounded-xl shadow-inner'>
                  <img src={qrApiUrl} alt='QR Code' className='w-52 h-52 object-contain' />
                </div>
              )}

              <Typography variant='caption' className='text-textSecondary break-all font-mono bg-slate-50 p-2 rounded border w-full'>
                {publicUrl}
              </Typography>

              <Box className='flex gap-2 w-full'>
                <Button variant='contained' fullWidth size='small' onClick={copyQrPublicLink}>
                  {copiedLink ? '✓ Copied!' : 'Copy Public Link'}
                </Button>
                <Button
                  variant='outlined'
                  fullWidth
                  size='small'
                  component='a'
                  href={publicUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Open Page ↗
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQrModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 3D Tour .ZIP Upload & Auto-Extraction Modal */}
      <Dialog open={openZipDialog} onClose={() => !uploadingZip && setOpenZipDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center gap-2 font-bold text-slate-800 border-b pb-3'>
          <span className='text-2xl'>📦</span>
          <span>{zipTargetId ? 'Replace / Update Existing 3D Tour (.zip)' : 'Upload 3D Virtual Tour Package (.zip)'}</span>
        </DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-5'>
          <Typography variant='body2' className='text-slate-600 bg-orange-50 border border-orange-200 p-3 rounded-xl'>
            💡 <strong>Exported from 3DVista, TDV Player, Pannellum, or Marzipano?</strong>
            <br />
            {zipTargetId 
              ? 'Uploading a new .zip will replace all panoramas, tiles, sound, and scripts for this temple while keeping the exact same link and QR codes!' 
              : 'Select your exported .zip file. The system will automatically unzip all 360° panoramas, scripts, sound, UI buttons, and generate your live 3D Darshan tour!'}
          </Typography>

          {zipErrorMsg && (
            <Alert severity='error' onClose={() => setZipErrorMsg(null)}>
              {zipErrorMsg}
            </Alert>
          )}

          {zipSuccessMsg && (
            <Alert severity='success'>
              {zipSuccessMsg}
            </Alert>
          )}

          {/* Target Tour Mode Selector */}
          <TextField
            select
            label='Action Mode'
            value={zipTargetId}
            onChange={e => {
              const selectedId = e.target.value
              setZipTargetId(selectedId)
              if (selectedId) {
                const found = items.find(i => i.id === selectedId)
                if (found) {
                  setZipTitle(found.title)
                  setZipSlug(found.slug)
                  setZipDescription(found.description || '')
                }
              } else {
                setZipTitle('')
                setZipSlug('')
                setZipDescription('')
              }
            }}
            disabled={uploadingZip}
            fullWidth
            size='small'
            helperText={zipTargetId ? 'Replacing will update the files under the existing URL and preserve QR codes.' : 'Creating a brand new 3D tour item.'}
          >
            <MenuItem value=''>➕ Create New 3D Tour Item</MenuItem>
            {items.map(i => (
              <MenuItem key={i.id} value={i.id}>
                🔄 Replace: {i.title} (/front-pages/vr/{i.slug})
              </MenuItem>
            ))}
          </TextField>

          <div className='flex flex-col gap-1.5'>
            <Typography variant='caption' className='font-bold text-slate-700 uppercase'>
              Select .ZIP Tour File *
            </Typography>
            <div className='border-2 border-dashed border-orange-300 bg-orange-50/40 rounded-xl p-6 text-center hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-2'>
              <input
                type='file'
                id='tour-zip-file-input'
                accept='.zip'
                className='hidden'
                disabled={uploadingZip}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setZipFile(f)
                    if (!zipTitle) {
                      setZipTitle(f.name.replace(/\.zip$/i, '').replace(/[-_]+/g, ' '))
                    }
                  }
                }}
              />
              <label htmlFor='tour-zip-file-input' className='cursor-pointer flex flex-col items-center gap-2'>
                <div className='w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-sm'>
                  📁
                </div>
                <Typography className='font-bold text-sm text-slate-800'>
                  {zipFile ? zipFile.name : 'Click to select or drag .zip tour file'}
                </Typography>
                <Typography variant='caption' className='text-slate-500'>
                  {zipFile ? `${(zipFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Supports 3DVista, WebXR, Cubic/Equirectangular HTML5 packages'}
                </Typography>
              </label>
            </div>
          </div>

          <TextField
            label='Temple / 3D Tour Title'
            value={zipTitle}
            onChange={e => setZipTitle(e.target.value)}
            disabled={uploadingZip}
            fullWidth
            size='small'
            placeholder='e.g. Mundru Dham Shri Ganesh 3D Darshan'
          />

          <TextField
            label='Custom URL Slug (Optional)'
            value={zipSlug}
            onChange={e => setZipSlug(e.target.value)}
            disabled={uploadingZip}
            fullWidth
            size='small'
            placeholder='e.g. mundru-mandir-3d (Auto-generated if left empty)'
          />

          <TextField
            label='Tour Description / Significance (Optional)'
            value={zipDescription}
            onChange={e => setZipDescription(e.target.value)}
            disabled={uploadingZip}
            multiline
            rows={2}
            fullWidth
            size='small'
            placeholder='e.g. Experience 360° holy sanctum darshan, garbha griha, and parikrama of the sacred temple.'
          />

          {uploadingZip && (
            <div className='flex flex-col items-center justify-center p-4 bg-slate-50 border rounded-xl gap-2 text-center'>
              <CircularProgress size={28} style={{ color: '#FF671F' }} />
              <Typography variant='body2' className='font-bold text-slate-700'>
                Uploading, unzipping & deploying 3D Tour assets...
              </Typography>
              <Typography variant='caption' className='text-slate-500'>
                Please wait while high-resolution 360° tiles, audio & scripts are deployed to server.
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions className='border-t px-6 py-3'>
          <Button onClick={() => setOpenZipDialog(false)} disabled={uploadingZip}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleUploadZip}
            disabled={uploadingZip || !zipFile}
            style={{ backgroundColor: '#FF671F' }}
            className='font-bold text-white'
          >
            {uploadingZip ? 'Deploying Tour...' : zipTargetId ? 'Unzip & Replace 3D Tour' : 'Unzip & Publish 3D Tour'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
