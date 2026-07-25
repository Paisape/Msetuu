'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

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
import Chip from '@mui/material/Chip'

// Keep in sync with PAGE_OPTIONS at the top of ContentManagementClient.tsx — every page that
// renders a ServiceFaq block. Duplicated here (rather than imported) so this file stays a fully
// independent, self-contained admin panel like the other bespoke ones in this folder
// (MediaGalleryDialog, PujaPackagesDialog) — deliberately not wired through the generic
// EntityManager, since the "Listing" dropdown below needs to react to the chosen Page, which
// EntityManager's static field config doesn't support.
const PAGE_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'chadhava', label: 'Chadhava' },
  { value: 'epuja', label: 'E-Puja' },
  { value: 'jyotish', label: 'Jyotish' },
  { value: 'kundli', label: 'Kundli' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'yatra', label: 'Yatra Booking' },
  { value: 'darshan', label: '3D Darshan' },
  { value: 'darshan-daily', label: 'Darshan' },
  { value: 'geotag', label: 'Geo-Tagging' },
  { value: 'login', label: 'Login Page' },
  { value: 'register', label: 'Register Page' }
]

// Only these pages have individual listings a FAQ can be scoped to — every other page is
// site/module-wide only (no "specific item" concept).
const LISTING_MODULES: Record<string, { api: string; labelKey: string }> = {
  chadhava: { api: '/api/chadhava/listings', labelKey: 'title' },
  epuja: { api: '/api/epuja/listings', labelKey: 'title' },
  kundli: { api: '/api/kundli/listings', labelKey: 'title' },
  ecommerce: { api: '/api/ecommerce/products', labelKey: 'name' }
}

type Faq = {
  id: string
  page: string
  listingId: string | null
  question: string
  answer: string
  order: number
  active: boolean
}

type ListingOption = { id: string; label: string; page: string }

const emptyForm = () => ({ page: PAGE_OPTIONS[0].value, listingId: '', question: '', answer: '', order: 0, active: true })

const FaqManagerClient = () => {
  const [items, setItems] = useState<Faq[]>([])
  const [listings, setListings] = useState<ListingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const [faqsRes, ...listingResList] = await Promise.all([
        fetch('/api/faqs?all=1'),
        ...Object.entries(LISTING_MODULES).map(([page, cfg]) => fetch(cfg.api).then(r => r.json().then(data => ({ page, data }))).catch(() => ({ page, data: [] })))
      ])

      const faqsData = await faqsRes.json().catch(() => [])

      if (!faqsRes.ok) throw new Error(faqsData?.error || 'Failed to load FAQs.')
      setItems(Array.isArray(faqsData) ? faqsData : [])

      const allListings: ListingOption[] = []

      for (const { page, data } of listingResList as { page: string; data: any }[]) {
        if (!Array.isArray(data)) continue
        const labelKey = LISTING_MODULES[page].labelKey

        for (const l of data) {
          allListings.push({ id: l.id, label: l[labelKey] || l.id, page })
        }
      }

      setListings(allListings)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load FAQs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const listingLabel = (faq: Faq) => {
    if (!faq.listingId) return 'All listings'
    const match = listings.find(l => l.id === faq.listingId)

    return match ? match.label : 'Specific listing'
  }

  const listingOptionsForPage = useMemo(() => listings.filter(l => l.page === form.page), [listings, form.page])
  const pageHasListings = Boolean(LISTING_MODULES[form.page])

  const openCreate = () => {
    setForm(emptyForm())
    setEditingId(null)
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEdit = (faq: Faq) => {
    setForm({ page: faq.page, listingId: faq.listingId || '', question: faq.question, answer: faq.answer, order: faq.order, active: faq.active })
    setEditingId(faq.id)
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setDialogError('Question and answer are required.')

      return
    }

    setSaving(true)
    setDialogError(null)

    try {
      const payload = {
        page: form.page,
        listingId: form.listingId || null,
        question: form.question,
        answer: form.answer,
        order: Number(form.order) || 0,
        active: form.active
      }

      const url = editingId ? `/api/faqs/${editingId}` : '/api/faqs'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to save FAQ.')

      await loadAll()
      handleClose()
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Failed to save FAQ.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (faq: Faq) => {
    if (!window.confirm('Delete this FAQ entry? This cannot be undone.')) return

    setErrorMsg(null)

    try {
      const res = await fetch(`/api/faqs/${faq.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to delete.')
      await loadAll()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete.')
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <Typography variant='h5' className='font-bold'>
          FAQ
        </Typography>
        <Button variant='contained' onClick={openCreate} startIcon={<i className='tabler-plus' />}>
          Add FAQ
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
                  <TableCell>Page</TableCell>
                  <TableCell>Applies To</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No FAQs configured yet — pages fall back to their built-in defaults.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(faq => (
                    <TableRow key={faq.id}>
                      <TableCell>{PAGE_OPTIONS.find(p => p.value === faq.page)?.label || faq.page}</TableCell>
                      <TableCell>{listingLabel(faq)}</TableCell>
                      <TableCell className='max-w-[280px]'>
                        <span className='line-clamp-2 inline-block'>{faq.question}</span>
                      </TableCell>
                      <TableCell>{faq.order}</TableCell>
                      <TableCell>
                        <Chip size='small' label={faq.active ? 'Yes' : 'No'} color={faq.active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => openEdit(faq)} aria-label='Edit'>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDelete(faq)} aria-label='Delete'>
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
        <DialogTitle className='font-bold'>{editingId ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          {dialogError && <Alert severity='error'>{dialogError}</Alert>}

          <Select
            fullWidth
            size='small'
            value={form.page}
            onChange={e => setForm(prev => ({ ...prev, page: e.target.value, listingId: '' }))}
          >
            {PAGE_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>

          {pageHasListings && (
            <Select
              fullWidth
              size='small'
              value={form.listingId}
              displayEmpty
              onChange={e => setForm(prev => ({ ...prev, listingId: e.target.value }))}
            >
              <MenuItem value=''>All listings in this module (general FAQ)</MenuItem>
              {listingOptionsForPage.map(l => (
                <MenuItem key={l.id} value={l.id}>
                  {l.label}
                </MenuItem>
              ))}
            </Select>
          )}

          <TextField
            label='Question'
            fullWidth
            value={form.question}
            onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
          />
          <TextField
            label='Answer'
            fullWidth
            multiline
            minRows={3}
            value={form.answer}
            onChange={e => setForm(prev => ({ ...prev, answer: e.target.value }))}
          />
          <TextField
            label='Display order'
            type='number'
            fullWidth
            value={form.order}
            onChange={e => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
          />
          <FormControlLabel
            control={<Switch checked={form.active} onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))} />}
            label='Active'
          />
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

export default FaqManagerClient
