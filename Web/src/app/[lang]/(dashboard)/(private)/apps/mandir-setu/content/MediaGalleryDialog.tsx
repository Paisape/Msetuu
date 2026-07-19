'use client'

import { useState } from 'react'

import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

type MediaItem = { url: string; type: 'image' | 'video' }

const MAX_MEDIA_ITEMS = 20

type Props = {

  // Listing/product row from the table — needs `id` and whatever title field to show, plus the
  // current `media` array (may be absent on older rows created before this feature).
  item: Record<string, any>
  titleKey: string

  // Direct PATCH endpoint for this row, e.g. `/api/chadhava/listings/${id}` — reuses the same
  // listing update route the rest of the form uses, rather than a separate media sub-resource.
  patchUrl: string

  // Which /api/upload `type` bucket to resize images into (chadhava/epuja/product), so gallery
  // images match the section's standard display size.
  uploadType: string
  onSaved?: () => void
}

// Admin-only ordered image/video gallery editor for one listing/product row. Opened via a
// per-row "Manage Gallery" button in the Content Management console, mirroring the existing
// PujaPackagesDialog pattern. Reorder is done with up/down arrows (array position = display
// order on the storefront's auto-scrolling carousel).
const MediaGalleryDialog = ({ item, titleKey, patchUrl, uploadType, onSaved }: Props) => {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>(Array.isArray(item.media) ? item.media : [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setMedia(Array.isArray(item.media) ? item.media : [])
    setError(null)
    setOpen(true)
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (media.length >= MAX_MEDIA_ITEMS) {
      setError(`A maximum of ${MAX_MEDIA_ITEMS} media items is allowed.`)

      return
    }

    setUploading(true)
    setError(null)

    try {
      const remainingSlots = MAX_MEDIA_ITEMS - media.length
      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      const uploaded: MediaItem[] = []

      for (const file of filesToUpload) {
        const formData = new FormData()

        formData.append('file', file)
        formData.append('type', uploadType)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json().catch(() => null)

        if (!res.ok) throw new Error(data?.error || `Failed to upload ${file.name}.`)

        uploaded.push({ url: data.url, type: file.type.startsWith('video/') ? 'video' : 'image' })
      }

      setMedia(prev => [...prev, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction

    if (targetIndex < 0 || targetIndex >= media.length) return

    setMedia(prev => {
      const next = [...prev]
      const [moved] = next.splice(index, 1)

      next.splice(targetIndex, 0, moved)

      return next
    })
  }

  const removeItem = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to save gallery.')

      onSaved?.()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save gallery.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <IconButton size='small' onClick={handleOpen} aria-label='Manage gallery'>
        <i className='tabler-photo-video' />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle className='font-bold'>Gallery — {item[titleKey]}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          {error && <Alert severity='error'>{error}</Alert>}

          <Typography variant='body2' className='text-textSecondary'>
            Add multiple images/videos and reorder them — the storefront shows them as an
            auto-scrolling carousel in this order, in addition to the main listing image.
          </Typography>

          {media.length === 0 ? (
            <Typography className='text-textSecondary'>No gallery items yet — upload some below.</Typography>
          ) : (
            <div className='flex flex-col gap-2'>
              {media.map((m, i) => (
                <div key={`${m.url}-${i}`} className='flex items-center gap-3 p-2' style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
                  {m.type === 'video' ? (
                    <video src={m.url} className='w-16 h-16 object-cover rounded' muted />
                  ) : (
                    <img src={m.url} alt='' className='w-16 h-16 object-cover rounded' />
                  )}
                  <Typography variant='caption' className='flex-1 truncate'>
                    {m.type === 'video' ? 'Video' : 'Image'} #{i + 1}
                  </Typography>
                  <IconButton size='small' disabled={i === 0} onClick={() => moveItem(i, -1)} aria-label='Move up'>
                    <i className='tabler-arrow-up' />
                  </IconButton>
                  <IconButton size='small' disabled={i === media.length - 1} onClick={() => moveItem(i, 1)} aria-label='Move down'>
                    <i className='tabler-arrow-down' />
                  </IconButton>
                  <IconButton size='small' onClick={() => removeItem(i)} aria-label='Remove'>
                    <i className='tabler-trash' />
                  </IconButton>
                </div>
              ))}
            </div>
          )}

          <Button component='label' variant='outlined' disabled={uploading || media.length >= MAX_MEDIA_ITEMS}>
            {uploading ? <CircularProgress size={16} /> : 'Upload images/videos'}
            <input
              type='file'
              accept='image/*,video/*'
              multiple
              hidden
              onChange={e => {
                handleFilesSelected(e.target.files)
                e.target.value = ''
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color='inherit'>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save Gallery'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default MediaGalleryDialog
