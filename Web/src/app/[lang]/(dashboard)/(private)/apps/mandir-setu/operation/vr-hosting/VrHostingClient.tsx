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
        <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleOpenAdd}>
          Add New VR Media
        </Button>
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
                    filteredItems.map(item => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.title} className='w-12 h-12 object-cover rounded-lg border' />
                            ) : (
                              <div className='w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl'>
                                {item.mediaType === 'VR_360_IMAGE' ? '🥽' : '🎥'}
                              </div>
                            )}
                            <div>
                              <Typography className='font-semibold text-sm'>{item.title}</Typography>
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
                            label={item.mediaType.replace('_', ' ')}
                            color={item.mediaType === 'VR_360_IMAGE' ? 'primary' : 'secondary'}
                            variant='outlined'
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
                            <Button
                              size='small'
                              variant='outlined'
                              color='info'
                              startIcon={<i className='tabler-qrcode' />}
                              onClick={() => handleShowQr(item)}
                            >
                              QR & Link
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
                    ))
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
    </div>
  )
}
