'use client'

import { useState, useEffect } from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Rating from '@mui/material/Rating'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

type Props = {
  orderType: 'CHADHAVA' | 'EPUJA' | 'KUNDLI' | 'JYOTISH' | 'ECOMMERCE'
  orderId: string
  itemLabel: string
}

type ExistingReview = { id: string; rating: number; comment: string | null; status: string } | null
type MediaItem = { url: string; type: 'image' | 'video' }

const MAX_MEDIA_ITEMS = 5

// Shown next to a PAID order on the My Orders page. Checks whether the logged-in user already
// reviewed this specific order and shows either "Write a Review" or the review's moderation
// status; submission is a verified-purchase POST to /api/reviews (the server re-checks
// ownership + PAID status independently — this component just gates the UI entry point).
const WriteReviewDialog = ({ orderType, orderId, itemLabel }: Props) => {
  const [existing, setExisting] = useState<ExistingReview>(null)
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(5)
  const [comment, setComment] = useState('')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/reviews?orderType=${orderType}&orderId=${orderId}`)
      .then(res => res.json())
      .then(data => setExisting(data.review || null))
      .catch(() => {
        // If the check fails, still allow the button — submission itself is re-validated server-side
      })
      .finally(() => setChecked(true))
  }, [orderType, orderId])

  const handleMediaSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = MAX_MEDIA_ITEMS - media.length

    if (remainingSlots <= 0) {
      setErrorMsg(`You can attach up to ${MAX_MEDIA_ITEMS} photos/videos.`)

      return
    }

    setUploadingMedia(true)
    setErrorMsg(null)

    try {
      const toUpload = Array.from(files).slice(0, remainingSlots)

      for (const file of toUpload) {
        const formData = new FormData()

        formData.append('file', file)

        const res = await fetch('/api/upload/review-media', { method: 'POST', body: formData })
        const data = await res.json().catch(() => null)

        if (!res.ok) throw new Error(data?.error || 'Failed to upload media.')

        setMedia(prev => [...prev, { url: data.url, type: data.type }])
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload media.')
    } finally {
      setUploadingMedia(false)
    }
  }

  const removeMedia = (url: string) => {
    setMedia(prev => prev.filter(m => m.url !== url))
  }

  const handleSubmit = async () => {
    if (!rating) {
      setErrorMsg('Please select a star rating.')

      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderType, orderId, rating, comment, media })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to submit review.')

      setExisting(data)
      setOpen(false)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!checked) return null

  if (existing) {
    return (
      <Chip
        size='small'
        label={existing.status === 'APPROVED' ? 'Your review is live' : existing.status === 'REJECTED' ? 'Review rejected' : 'Review pending approval'}
        color={existing.status === 'APPROVED' ? 'success' : existing.status === 'REJECTED' ? 'error' : 'warning'}
      />
    )
  }

  return (
    <>
      <Button size='small' variant='outlined' onClick={() => setOpen(true)} style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}>
        Write a Review
      </Button>

      <Dialog
        open={open}
        onClose={() => !submitting && setOpen(false)}
        PaperProps={{
          className: 'galaxy-card max-w-sm w-full p-4',
          style: { border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px' }
        }}
      >
        <DialogTitle className='font-bold' style={{ color: '#059669' }}>
          Review: {itemLabel}
        </DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          {errorMsg && <Alert severity='error'>{errorMsg}</Alert>}
          <div>
            <Typography variant='body2' className='mb-1' style={{ color: '#374151' }}>
              Your rating
            </Typography>
            <Rating
              value={rating}
              onChange={(_, val) => setRating(val)}
              sx={{ '& .MuiRating-iconFilled': { color: '#f59e0b' } }}
            />
          </div>
          <TextField
            label='Your review (optional)'
            placeholder='Share your experience with this offering...'
            multiline
            rows={3}
            fullWidth
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div>
            <Typography variant='body2' className='mb-1' style={{ color: '#374151' }}>
              Add photos or videos (optional, up to {MAX_MEDIA_ITEMS})
            </Typography>
            <Button component='label' variant='outlined' size='small' disabled={uploadingMedia || media.length >= MAX_MEDIA_ITEMS} style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}>
              {uploadingMedia ? <CircularProgress size={16} /> : 'Upload photo/video'}
              <input
                type='file'
                accept='image/*,video/*'
                multiple
                hidden
                onChange={e => {
                  handleMediaSelect(e.target.files)
                  e.target.value = ''
                }}
              />
            </Button>
            {media.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {media.map(item => (
                  <div key={item.url} className='relative'>
                    {item.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt='' className='w-16 h-16 object-cover rounded' />
                    ) : (
                      <video src={item.url} className='w-16 h-16 object-cover rounded' muted />
                    )}
                    <button
                      type='button'
                      onClick={() => removeMedia(item.url)}
                      className='absolute -top-1.5 -right-1.5 bg-white rounded-full shadow'
                      style={{ width: 18, height: 18, lineHeight: '18px', fontSize: 12, color: '#dc2626', border: '1px solid #e5e7eb' }}
                      aria-label='Remove'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={submitting} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className='galaxy-glow-btn font-bold'>
            {submitting ? <CircularProgress size={18} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default WriteReviewDialog
