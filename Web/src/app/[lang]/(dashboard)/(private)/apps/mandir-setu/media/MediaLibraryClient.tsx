'use client'

import { useState, useEffect, useRef } from 'react'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Tooltip from '@mui/material/Tooltip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

type MediaAsset = {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  mimeType: string
  fileSize: number
  createdAt: string
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default function MediaLibraryClient() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [tabFilter, setTabFilter] = useState('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<MediaAsset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/media?type=${tabFilter}&search=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('Failed to load media assets')
      const data = await res.json()
      if (Array.isArray(data)) setAssets(data)
    } catch (err: any) {
      setNotification({ message: err.message || 'Error fetching assets', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [tabFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAssets()
  }

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setNotification(null)

    try {
      let uploadedCount = 0
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/media', {
          method: 'POST',
          body: formData
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.error || `Failed to upload ${file.name}`)
        }
        uploadedCount++
      }

      setNotification({
        message: `Successfully uploaded ${uploadedCount} file${uploadedCount > 1 ? 's' : ''}!`,
        severity: 'success'
      })
      await fetchAssets()
    } catch (err: any) {
      setNotification({ message: err.message || 'Upload failed', severity: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCopyUrl = (asset: MediaAsset, isFullUrl = true) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const targetUrl = isFullUrl ? `${origin}${asset.fileUrl}` : asset.fileUrl

    navigator.clipboard.writeText(targetUrl)
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 2500)
    setNotification({ message: `Copied URL: ${targetUrl}`, severity: 'success' })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteAsset) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/media/${deleteAsset.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete asset')
      setNotification({ message: 'Asset deleted permanently.', severity: 'success' })
      setAssets(prev => prev.filter(a => a.id !== deleteAsset.id))
      setDeleteAsset(null)
    } catch (err: any) {
      setNotification({ message: err.message || 'Error deleting asset', severity: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <Typography variant='h4' className='font-bold text-slate-800 flex items-center gap-2'>
            <span>📁</span> Media Library & Asset Manager
          </Typography>
          <Typography variant='body2' className='text-slate-500 mt-1'>
            Upload high-resolution images & videos for Offer Links, Landing Pages, and Campaigns. Permanent URLs are generated and never erased.
          </Typography>
        </div>
        <div>
          <input
            type='file'
            ref={fileInputRef}
            multiple
            accept='image/*,video/*,audio/*,application/pdf'
            className='hidden'
            onChange={e => handleUploadFiles(e.target.files)}
          />
          <Button
            variant='contained'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-upload' />}
            sx={{
              background: 'linear-gradient(135deg, #006241, #34d399)',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: '10px'
            }}
          >
            {uploading ? 'Uploading Files...' : 'Upload Image / Video'}
          </Button>
        </div>
      </div>

      {notification && (
        <Alert severity={notification.severity} className='mb-6' onClose={() => setNotification(null)}>
          {notification.message}
        </Alert>
      )}

      {/* Drag & Drop Upload Zone */}
      <Card
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          handleUploadFiles(e.dataTransfer.files)
        }}
        className='p-8 mb-8 border-2 border-dashed border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all text-center rounded-2xl cursor-pointer'
        onClick={() => fileInputRef.current?.click()}
      >
        <div className='flex flex-col items-center gap-3'>
          <div className='w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl shadow-sm'>
            <i className='tabler-cloud-upload' />
          </div>
          <Typography variant='h6' className='font-bold text-slate-700'>
            Drag & drop images or videos here, or click to browse
          </Typography>
          <Typography variant='caption' className='text-slate-500 max-w-md'>
            Supports JPG, PNG, WebP, GIF, MP4, WebM (up to 100MB per file). High-res posters automatically scale up to 2560px with zero watermarks.
          </Typography>
        </div>
      </Card>

      {/* Filters & Search */}
      <Card className='p-4 mb-6 shadow-sm rounded-xl'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <Tabs
            value={tabFilter}
            onChange={(_, val) => setTabFilter(val)}
            textColor='primary'
            indicatorColor='primary'
            className='min-h-0'
          >
            <Tab label='All Files' value='ALL' className='font-semibold text-sm' />
            <Tab label='🖼️ Images' value='IMAGE' className='font-semibold text-sm' />
            <Tab label='🎬 Videos' value='VIDEO' className='font-semibold text-sm' />
            <Tab label='🎵 Audio' value='AUDIO' className='font-semibold text-sm' />
          </Tabs>

          <form onSubmit={handleSearchSubmit} className='flex gap-2 items-center'>
            <TextField
              size='small'
              placeholder='Search by filename...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='min-w-[240px]'
            />
            <Button variant='outlined' type='submit' size='small' className='border-slate-300 text-slate-700'>
              Search
            </Button>
            <IconButton onClick={fetchAssets} size='small' color='primary' title='Refresh'>
              <i className='tabler-refresh' />
            </IconButton>
          </form>
        </div>
      </Card>

      {/* Grid of Assets */}
      {loading ? (
        <div className='flex justify-center p-16'>
          <CircularProgress style={{ color: '#006241' }} />
        </div>
      ) : assets.length === 0 ? (
        <Card className='p-16 text-center rounded-2xl bg-slate-50 border border-slate-200'>
          <div className='text-5xl mb-3'>🖼️</div>
          <Typography variant='h6' className='font-bold text-slate-700'>
            No media assets found
          </Typography>
          <Typography variant='body2' className='text-slate-400 mt-1 mb-4'>
            Upload your campaign images, temple darshan banners, or posters above.
          </Typography>
          <Button
            variant='outlined'
            onClick={() => fileInputRef.current?.click()}
            className='border-emerald-600 text-emerald-700 font-bold'
          >
            Upload Now
          </Button>
        </Card>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {assets.map(asset => {
            const isCopied = copiedId === asset.id
            const isVideo = asset.fileType === 'VIDEO'
            const isAudio = asset.fileType === 'AUDIO'

            return (
              <Card
                key={asset.id}
                className='flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200'
              >
                {/* Media Preview Box */}
                <div
                  className='relative w-full bg-slate-900 flex items-center justify-center cursor-pointer group'
                  style={{ height: '180px' }}
                  onClick={() => setPreviewAsset(asset)}
                >
                  {isVideo ? (
                    <div className='w-full h-full flex flex-col items-center justify-center text-white'>
                      <div className='w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform'>
                        ▶
                      </div>
                      <Typography variant='caption' className='mt-2 opacity-80'>
                        Click to play video
                      </Typography>
                    </div>
                  ) : isAudio ? (
                    <div className='w-full h-full flex flex-col items-center justify-center text-emerald-400'>
                      <div className='text-4xl mb-1'>🎵</div>
                      <Typography variant='caption' className='text-slate-300'>
                        Audio File
                      </Typography>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.fileUrl}
                      alt={asset.fileName}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                  )}

                  <div className='absolute top-2 right-2 flex gap-1'>
                    <Chip
                      size='small'
                      label={asset.fileType}
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: isVideo ? 'rgba(219,39,119,0.85)' : 'rgba(0,98,65,0.85)',
                        color: 'white'
                      }}
                    />
                  </div>
                </div>

                {/* Details & Actions */}
                <div className='p-4 flex-1 flex flex-col justify-between bg-white'>
                  <div>
                    <Typography
                      variant='body2'
                      className='font-bold text-slate-800 line-clamp-1'
                      title={asset.fileName}
                    >
                      {asset.fileName}
                    </Typography>
                    <div className='flex items-center justify-between text-[11px] text-slate-400 mt-1 mb-3'>
                      <span>{formatBytes(asset.fileSize)}</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <div className='flex flex-col gap-2 pt-2 border-t border-slate-100'>
                    <Button
                      size='small'
                      fullWidth
                      variant={isCopied ? 'contained' : 'outlined'}
                      color={isCopied ? 'success' : 'primary'}
                      onClick={() => handleCopyUrl(asset, true)}
                      startIcon={<i className={isCopied ? 'tabler-check' : 'tabler-copy'} />}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: 12,
                        borderRadius: '8px'
                      }}
                    >
                      {isCopied ? 'URL Copied!' : 'Copy Full URL'}
                    </Button>

                    <div className='flex items-center justify-between gap-2'>
                      <Tooltip title='Copy relative path (/uploads/...)'>
                        <Button
                          size='small'
                          variant='text'
                          onClick={() => handleCopyUrl(asset, false)}
                          className='text-[11px] text-slate-500 font-semibold'
                        >
                          Copy Path
                        </Button>
                      </Tooltip>

                      <IconButton
                        size='small'
                        onClick={() => setDeleteAsset(asset)}
                        className='text-slate-400 hover:text-red-600'
                        title='Delete Asset'
                      >
                        <i className='tabler-trash text-lg' />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        maxWidth='md'
        fullWidth
        PaperProps={{ className: 'p-4 rounded-2xl' }}
      >
        <DialogTitle className='font-bold flex justify-between items-center pb-2'>
          <span className='line-clamp-1 text-base'>{previewAsset?.fileName}</span>
          <IconButton size='small' onClick={() => setPreviewAsset(null)}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>
        <DialogContent className='flex flex-col items-center justify-center p-2'>
          {previewAsset?.fileType === 'VIDEO' ? (
            <video
              src={previewAsset.fileUrl}
              controls
              autoPlay
              className='max-h-[70vh] w-auto max-w-full rounded-lg shadow'
            />
          ) : previewAsset?.fileType === 'AUDIO' ? (
            <audio src={previewAsset.fileUrl} controls autoPlay className='w-full my-8' />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewAsset?.fileUrl}
              alt={previewAsset?.fileName}
              className='max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow'
            />
          )}

          <div className='w-full mt-4 p-3 bg-slate-50 border rounded-lg flex items-center justify-between gap-3 text-xs text-slate-600'>
            <span className='truncate font-mono'>{typeof window !== 'undefined' ? `${window.location.origin}${previewAsset?.fileUrl}` : previewAsset?.fileUrl}</span>
            {previewAsset && (
              <Button
                size='small'
                variant='contained'
                onClick={() => handleCopyUrl(previewAsset, true)}
                className='shrink-0'
              >
                Copy URL
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteAsset)} onClose={() => setDeleteAsset(null)} maxWidth='xs' fullWidth>
        <DialogTitle className='font-bold text-red-600'>Delete Media Asset?</DialogTitle>
        <DialogContent>
          <Typography variant='body2' className='text-slate-600 mb-2'>
            Are you sure you want to delete <strong>{deleteAsset?.fileName}</strong>?
          </Typography>
          <Typography variant='caption' className='text-slate-400'>
            ⚠️ If any landing page or offer link is currently using this image/video URL, it will stop displaying.
          </Typography>
        </DialogContent>
        <DialogActions className='p-4'>
          <Button onClick={() => setDeleteAsset(null)} disabled={deleting} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} disabled={deleting} color='error' variant='contained'>
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
