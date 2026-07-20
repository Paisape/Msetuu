'use client'

import { useState, useEffect, useCallback } from 'react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

export type FieldConfig = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'image' | 'select' | 'audio'
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: unknown

  // For image fields: which standard section size the server should resize/compress to
  // (e.g. 'banner', 'product', 'shop-purpose', 'qr'). Defaults to a generic size if omitted.
  uploadType?: string

  // For number fields only: leave blank instead of defaulting to 0, and send null (not 0)
  // when saved empty. Used for fields like offerPrice/GST% that are genuinely optional.
  optional?: boolean

  // Small helper text shown under the field.
  helperText?: string
}

export type ColumnConfig = {
  key: string
  label: string
  render?: (item: Record<string, any>) => React.ReactNode
}

type EntityManagerProps = {
  title: string
  listUrl: string
  itemUrl: (id: string) => string
  fields: FieldConfig[]
  columns: ColumnConfig[]
  emptyMessage?: string

  // Optional extra buttons rendered before Edit/Delete in each row's Actions cell —
  // e.g. a "Manage Packages" button for E-Puja listings.
  extraRowActions?: (item: Record<string, any>, refresh: () => Promise<void>) => React.ReactNode
}

type UploadResult = { url: string; originalSizeBytes: number; finalSizeBytes: number }

const uploadFile = async (file: File, uploadType: string): Promise<UploadResult> => {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('type', uploadType)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json().catch(() => null)

  if (!res.ok) throw new Error(data?.error || 'Upload failed.')

  return { url: data.url, originalSizeBytes: data.originalSizeBytes ?? file.size, finalSizeBytes: data.finalSizeBytes ?? file.size }
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const defaultValueFor = (field: FieldConfig) => {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'boolean') return false
  if (field.type === 'number') return field.optional ? '' : 0

  return ''
}

const EntityManager = ({ title, listUrl, itemUrl, fields, columns, emptyMessage, extraRowActions }: EntityManagerProps) => {
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [uploadSizeInfo, setUploadSizeInfo] = useState<Record<string, { original: number; final: number }>>({})
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch(listUrl)
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || `Failed to load ${title}.`)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : `Failed to load ${title}.`)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreate = () => {
    const defaults: Record<string, any> = {}

    fields.forEach(f => {
      defaults[f.key] = defaultValueFor(f)
    })
    setFormValues(defaults)
    setEditingId(null)
    setDialogError(null)
    setUploadSizeInfo({})
    setDialogOpen(true)
  }

  const openEdit = (item: Record<string, any>) => {
    const values: Record<string, any> = {}

    fields.forEach(f => {
      values[f.key] = item[f.key] ?? defaultValueFor(f)
    })
    setFormValues(values)
    setEditingId(item.id)
    setDialogError(null)
    setUploadSizeInfo({})
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingId(null)
  }

  const handleFieldChange = (key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleFileUpload = async (field: FieldConfig, file: File) => {
    setUploadingKey(field.key)
    setDialogError(null)

    try {
      const result = await uploadFile(file, field.uploadType || 'default')

      handleFieldChange(field.key, result.url)
      setUploadSizeInfo(prev => ({ ...prev, [field.key]: { original: result.originalSizeBytes, final: result.finalSizeBytes } }))
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploadingKey(null)
    }
  }

  const handleSave = async () => {
    for (const field of fields) {
      if (field.required && !formValues[field.key] && formValues[field.key] !== 0) {
        setDialogError(`${field.label} is required.`)

        return
      }
    }

    setSaving(true)
    setDialogError(null)

    try {
      const payload: Record<string, unknown> = {}

      fields.forEach(f => {
        if (f.type === 'number') {
          const raw = formValues[f.key]

          payload[f.key] = f.optional && (raw === '' || raw === null || raw === undefined) ? null : Number(raw)
        } else {
          payload[f.key] = formValues[f.key]
        }
      })

      const url = editingId ? itemUrl(editingId) : listUrl
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to save.')

      await fetchItems()
      handleClose()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Record<string, any>) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()} entry? This cannot be undone.`)) return

    setErrorMsg(null)

    try {
      const res = await fetch(itemUrl(item.id), { method: 'DELETE' })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to delete.')
      await fetchItems()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete.')
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <Typography variant='h5' className='font-bold'>
          {title}
        </Typography>
        <Button variant='contained' onClick={openCreate} startIcon={<i className='tabler-plus' />}>
          Add {title}
        </Button>
      </div>

      {errorMsg && (
        <Alert severity='error' className='mb-4' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Card>
        {loading ? (
          <div className='p-12 text-center'>
            <CircularProgress size={24} />
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map(col => (
                    <TableCell key={col.key}>{col.label}</TableCell>
                  ))}
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} align='center'>
                      {emptyMessage || `No ${title.toLowerCase()} yet.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(item => (
                    <TableRow key={item.id}>
                      {columns.map(col => (
                        <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? '')}</TableCell>
                      ))}
                      <TableCell align='right'>
                        {extraRowActions?.(item, fetchItems)}
                        <IconButton size='small' onClick={() => openEdit(item)} aria-label='Edit'>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDelete(item)} aria-label='Delete'>
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth='sm'>
        <DialogTitle className='font-bold'>
          {editingId ? `Edit ${title}` : `Add ${title}`}
        </DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          {dialogError && <Alert severity='error'>{dialogError}</Alert>}

          {fields.map(field => {
            const value = formValues[field.key]

            if (field.type === 'boolean') {
              return (
                <FormControlLabel
                  key={field.key}
                  control={
                    <Switch checked={Boolean(value)} onChange={e => handleFieldChange(field.key, e.target.checked)} />
                  }
                  label={field.label}
                />
              )
            }

            if (field.type === 'select') {
              return (
                <Select
                  key={field.key}
                  fullWidth
                  size='small'
                  value={value ?? ''}
                  displayEmpty
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                >
                  <MenuItem value='' disabled>
                    {field.label}
                  </MenuItem>
                  {(field.options || []).map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              )
            }

            if (field.type === 'image') {
              const sizeInfo = uploadSizeInfo[field.key]

              return (
                <div key={field.key} className='flex flex-col gap-2'>
                  <TextField
                    label={field.label}
                    placeholder='https://...'
                    fullWidth
                    value={value ?? ''}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                  />
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Button component='label' variant='outlined' size='small' disabled={uploadingKey === field.key}>
                      {uploadingKey === field.key ? <CircularProgress size={16} /> : `Or upload a file for ${field.label}`}
                      <input
                        type='file'
                        accept='image/*'
                        hidden
                        onChange={e => {
                          const file = e.target.files?.[0]

                          if (file) handleFileUpload(field, file)
                        }}
                      />
                    </Button>
                    {sizeInfo && (
                      <Typography variant='caption' className='text-textSecondary'>
                        {formatBytes(sizeInfo.original)} → {formatBytes(sizeInfo.final)} after compression
                      </Typography>
                    )}
                  </div>
                  {value && <img src={value} alt='' className='h-20 w-20 object-cover rounded' />}
                </div>
              )
            }

            if (field.type === 'audio') {
              const sizeInfo = uploadSizeInfo[field.key]

              return (
                <div key={field.key} className='flex flex-col gap-2'>
                  <TextField
                    label={field.label}
                    placeholder='https://...'
                    fullWidth
                    value={value ?? ''}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                  />
                  <div className='flex items-center gap-2 flex-wrap'>
                    <Button component='label' variant='outlined' size='small' disabled={uploadingKey === field.key}>
                      {uploadingKey === field.key ? <CircularProgress size={16} /> : `Or upload an audio file for ${field.label}`}
                      <input
                        type='file'
                        accept='audio/*'
                        hidden
                        onChange={e => {
                          const file = e.target.files?.[0]

                          if (file) handleFileUpload(field, file)
                        }}
                      />
                    </Button>
                    {sizeInfo && (
                      <Typography variant='caption' className='text-textSecondary'>
                        {formatBytes(sizeInfo.original)} → {formatBytes(sizeInfo.final)}
                      </Typography>
                    )}
                  </div>
                  {value && (
                    <audio src={value} controls className='w-full mt-2' />
                  )}
                </div>
              )
            }

            return (
              <TextField
                key={field.key}
                label={field.label}
                fullWidth
                type={field.type === 'number' ? 'number' : 'text'}
                multiline={field.type === 'textarea'}
                minRows={field.type === 'textarea' ? 3 : undefined}
                value={value ?? ''}
                helperText={field.helperText}
                onChange={e => handleFieldChange(field.key, e.target.value)}
              />
            )
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color='inherit'>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default EntityManager
