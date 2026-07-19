'use client'

import { useState } from 'react'

import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

type PujaPackage = {
  id: string
  type: string
  price: number
  offerPrice?: number | null
  gstPercentage?: number | null
  gstInclusive?: boolean
}

const PACKAGE_TYPES = ['Single', 'Couple', 'Family']

const packagePriceLabel = (pkg: PujaPackage) =>
  pkg.offerPrice && pkg.offerPrice > 0 && pkg.offerPrice < pkg.price ? (
    <>
      <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 4 }}>₹{pkg.price}</span>
      <strong>₹{pkg.offerPrice}</strong>
    </>
  ) : (
    `₹${pkg.price}`
  )

// Manages the Single/Couple/Family package pricing for one E-Puja listing.
// Opened via a per-row "Manage Packages" button in the Content Management console.
const PujaPackagesDialog = ({ listing }: { listing: Record<string, any> }) => {
  const [open, setOpen] = useState(false)
  const [packages, setPackages] = useState<PujaPackage[]>(listing.packages || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [newType, setNewType] = useState('Single')
  const [newPrice, setNewPrice] = useState('')
  const [newOfferPrice, setNewOfferPrice] = useState('')
  const [newGstPercentage, setNewGstPercentage] = useState('')
  const [newGstInclusive, setNewGstInclusive] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editOfferPrice, setEditOfferPrice] = useState('')
  const [editGstPercentage, setEditGstPercentage] = useState('')
  const [editGstInclusive, setEditGstInclusive] = useState(true)

  const refresh = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/epuja/listings/${listing.id}`)
      const data = await res.json().catch(() => null)

      if (res.ok && data) setPackages(data.packages || [])
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async () => {
    setOpen(true)
    setError(null)
    await refresh()
  }

  const handleAdd = async () => {
    const priceNum = Number(newPrice)
    const offerNum = newOfferPrice ? Number(newOfferPrice) : null

    if (!newType || !newPrice || priceNum <= 0) {
      setError('Choose a type and enter a positive price.')

      return
    }

    if (offerNum !== null && offerNum <= 0) {
      setError('Offer price must be a positive number.')

      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/epuja/listings/${listing.id}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          price: priceNum,
          offerPrice: offerNum,
          gstPercentage: newGstPercentage ? Number(newGstPercentage) : 0,
          gstInclusive: newGstInclusive
        })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to add package.')
      setNewPrice('')
      setNewOfferPrice('')
      setNewGstPercentage('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add package.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePrice = async (pkgId: string) => {
    const priceNum = Number(editPrice)
    const offerNum = editOfferPrice ? Number(editOfferPrice) : null

    if (!editPrice || priceNum <= 0) {
      setError('Enter a positive price.')

      return
    }

    if (offerNum !== null && offerNum <= 0) {
      setError('Offer price must be a positive number.')

      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/epuja/listings/${listing.id}/packages/${pkgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: priceNum,
          offerPrice: offerNum,
          gstPercentage: editGstPercentage ? Number(editGstPercentage) : 0,
          gstInclusive: editGstInclusive
        })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to update package.')
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update package.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePackage = async (pkgId: string) => {
    if (!window.confirm('Delete this package? This is blocked if any orders already reference it.')) return

    setError(null)

    try {
      const res = await fetch(`/api/epuja/listings/${listing.id}/packages/${pkgId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.error || 'Failed to delete package.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package.')
    }
  }

  return (
    <>
      <IconButton size='small' onClick={handleOpen} aria-label='Manage packages'>
        <i className='tabler-box' />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle className='font-bold'>Packages — {listing.title}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          {error && <Alert severity='error'>{error}</Alert>}

          {loading ? (
            <div className='text-center p-4'>
              <CircularProgress size={20} />
            </div>
          ) : packages.length === 0 ? (
            <Typography className='text-textSecondary'>No packages yet — add Single/Couple/Family pricing below.</Typography>
          ) : (
            packages.map(pkg => (
              <div key={pkg.id} className='flex flex-col gap-2 pb-2' style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className='flex items-center gap-2'>
                  <Typography className='flex-1 font-medium'>{pkg.type}</Typography>
                  {editingId === pkg.id ? (
                    <>
                      <Button size='small' variant='contained' onClick={() => handleUpdatePrice(pkg.id)} disabled={saving}>
                        Save
                      </Button>
                      <Button size='small' color='inherit' onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography>{packagePriceLabel(pkg)}</Typography>
                      <IconButton
                        size='small'
                        aria-label='Edit price'
                        onClick={() => {
                          setEditingId(pkg.id)
                          setEditPrice(String(pkg.price))
                          setEditOfferPrice(pkg.offerPrice ? String(pkg.offerPrice) : '')
                          setEditGstPercentage(pkg.gstPercentage ? String(pkg.gstPercentage) : '')
                          setEditGstInclusive(pkg.gstInclusive !== false)
                        }}
                      >
                        <i className='tabler-edit' />
                      </IconButton>
                      <IconButton size='small' aria-label='Delete package' onClick={() => handleDeletePackage(pkg.id)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </>
                  )}
                </div>
                {editingId === pkg.id && (
                  <div className='flex items-center gap-2 flex-wrap'>
                    <TextField
                      size='small'
                      type='number'
                      label='Sale price'
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      sx={{ width: 110 }}
                    />
                    <TextField
                      size='small'
                      type='number'
                      label='Offer price'
                      value={editOfferPrice}
                      onChange={e => setEditOfferPrice(e.target.value)}
                      sx={{ width: 110 }}
                    />
                    <TextField
                      size='small'
                      type='number'
                      label='GST %'
                      value={editGstPercentage}
                      onChange={e => setEditGstPercentage(e.target.value)}
                      sx={{ width: 90 }}
                    />
                    <FormControlLabel
                      control={<Switch size='small' checked={editGstInclusive} onChange={e => setEditGstInclusive(e.target.checked)} />}
                      label='Incl. GST'
                    />
                  </div>
                )}
              </div>
            ))
          )}

          <Divider />

          <div className='flex items-center gap-2 flex-wrap'>
            <Select size='small' value={newType} onChange={e => setNewType(e.target.value)} sx={{ width: 130 }}>
              {PACKAGE_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            <TextField
              size='small'
              type='number'
              label='Sale price (₹)'
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              sx={{ width: 120 }}
            />
            <TextField
              size='small'
              type='number'
              label='Offer price (₹)'
              value={newOfferPrice}
              onChange={e => setNewOfferPrice(e.target.value)}
              sx={{ width: 120 }}
            />
            <TextField
              size='small'
              type='number'
              label='GST %'
              value={newGstPercentage}
              onChange={e => setNewGstPercentage(e.target.value)}
              sx={{ width: 90 }}
            />
            <FormControlLabel
              control={<Switch size='small' checked={newGstInclusive} onChange={e => setNewGstInclusive(e.target.checked)} />}
              label='Incl. GST'
            />
            <Button variant='contained' size='small' onClick={handleAdd} disabled={saving}>
              {saving ? <CircularProgress size={16} /> : 'Add'}
            </Button>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PujaPackagesDialog
