'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import WriteReviewDialog from '@/components/WriteReviewDialog'

type MyOrder = {
  type: string
  id: string
  label: string
  amount: number | null
  status: string
  paymentStatus: string | null
  createdAt: string
  videoUrl?: string | null
  videoUploadedAt?: string | null
  videoExpired?: boolean
  targetId?: string | null
}

const REVIEWABLE_TYPES = new Set(['CHADHAVA', 'EPUJA', 'KUNDLI', 'JYOTISH', 'ECOMMERCE'])

type TrailEntry = { id: string; status: string; note?: string | null; createdAt: string; actorName: string }

const MODULE_LABEL: Record<string, string> = {
  CHADHAVA: 'Chadhava',
  EPUJA: 'E-Puja',
  JYOTISH: 'Jyotish',
  KUNDLI: 'Kundli',
  ECOMMERCE: 'Ecommerce',
  YATRA: 'Yatra'
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  CONFIRMED: 'info',
  SHARED_WITH_PANDIT: 'info',
  DISPATCHED: 'info',
  SHIPPED: 'info',
  COMPLETED: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error'
}


const ProfileTab = () => {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setFormData({ name: data.name || '', phone: data.phone || '', email: data.email || '' })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setProfile(data.user)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center p-12"><CircularProgress /></div>

  return (
    <Card className='galaxy-card p-4'>
      <CardContent>
        <Typography variant='h5' className='font-bold mb-4' style={{ color: '#006241' }}>Profile Details</Typography>
        {message.text && <Alert severity={message.type as any} className='mb-4'>{message.text}</Alert>}
        
        <form onSubmit={handleSave} className='flex flex-col gap-4 max-w-md'>
          <TextField 
            label='Name' 
            value={formData.name} 
            onChange={e => setFormData({ ...formData, name: e.target.value })} 
            required 
            fullWidth
          />
          <TextField 
            label='Email' 
            type='email'
            value={formData.email} 
            onChange={e => setFormData({ ...formData, email: e.target.value })} 
            required 
            fullWidth
          />
          <TextField 
            label='Phone' 
            value={formData.phone} 
            onChange={e => setFormData({ ...formData, phone: e.target.value })} 
            fullWidth
          />
          
          <Button type='submit' variant='contained' disabled={saving} style={{ backgroundColor: '#006241', color: 'white' }}>
            {saving ? <CircularProgress size={24} color='inherit' /> : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const AddressesTab = () => {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ label: '', fullAddress: '', isDefault: false })
  const [saving, setSaving] = useState(false)

  const fetchAddresses = () => {
    setLoading(true)
    fetch('/api/addresses')
      .then(r => r.json())
      .then(data => setAddresses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to save')
      setOpen(false)
      fetchAddresses()
    } catch (err) {
      alert('Error saving address')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return
    try {
      await fetch('/api/addresses/' + id, { method: 'DELETE' })
      fetchAddresses()
    } catch (err) {
      alert('Error deleting')
    }
  }
  
  const handleSetDefault = async (id: string) => {
    try {
      const address = addresses.find(a => a.id === id)
      await fetch('/api/addresses/' + id, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...address, isDefault: true })
      })
      fetchAddresses()
    } catch (err) {
      alert('Error setting default')
    }
  }

  if (loading) return <div className="text-center p-12"><CircularProgress /></div>

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <Typography variant='h5' className='font-bold' style={{ color: '#006241' }}>Saved Addresses</Typography>
        <Button variant='contained' onClick={() => { setFormData({ label: '', fullAddress: '', isDefault: false }); setOpen(true) }} style={{ backgroundColor: '#006241', color: 'white' }}>
          Add Address
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {addresses.length === 0 && <Typography color='text.secondary'>No addresses saved.</Typography>}
        {addresses.map(addr => (
          <Card key={addr.id} className='galaxy-card'>
            <CardContent>
              <div className='flex justify-between'>
                <Typography className='font-bold' style={{ color: '#006241' }}>{addr.label || 'Address'}</Typography>
                {addr.isDefault && <Chip size='small' label='Default' color='primary' />}
              </div>
              <Typography className='mt-3 text-sm whitespace-pre-wrap' style={{ color: '#374151' }}>{addr.fullAddress}</Typography>
              
              <div className='mt-6 flex gap-2'>
                {!addr.isDefault && (
                  <Button size='small' variant='outlined' onClick={() => handleSetDefault(addr.id)} style={{ color: '#006241', borderColor: '#006241' }}>Set Default</Button>
                )}
                <Button size='small' color='error' variant='text' onClick={() => handleDelete(addr.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Add New Address</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <TextField 
            label='Label (e.g. Home, Work)' 
            value={formData.label} 
            onChange={e => setFormData({ ...formData, label: e.target.value })} 
            fullWidth
            className='mt-2'
          />
          <TextField 
            label='Full Address' 
            value={formData.fullAddress} 
            onChange={e => setFormData({ ...formData, fullAddress: e.target.value })} 
            fullWidth
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions className='p-4'>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant='contained' disabled={saving || !formData.fullAddress} style={{ backgroundColor: '#006241', color: 'white' }}>
            {saving ? <CircularProgress size={24} color='inherit' /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

const OrdersTab = ({ orders, loading, errorMsg, expandedId, trail, trailLoading, toggleTrail }: any) => {
  if (errorMsg) return <Alert severity='error'>{errorMsg}</Alert>
  if (loading) return <div className='text-center p-12'><CircularProgress /></div>
  if (orders.length === 0) return (
    <Card className='galaxy-card p-8 text-center'>
      <Typography style={{ color: '#374151' }}>You haven&apos;t placed any orders yet.</Typography>
    </Card>
  )

  return (
    <div className='flex flex-col gap-4'>
      {orders.map((order: MyOrder) => {
        const rowKey = `${order.type}-${order.id}`

        return (
          <Card key={rowKey} className='galaxy-card'>
            <CardContent>
              <div className='flex items-center justify-between flex-wrap gap-3'>
                <div>
                  <Typography variant='caption' style={{ color: '#006241' }} className='font-semibold'>
                    {MODULE_LABEL[order.type]}
                  </Typography>
                  <Typography variant='h6' className='font-bold' style={{ color: '#047857' }}>
                    {order.label}
                  </Typography>
                  <Typography variant='caption' style={{ color: '#6b7280' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    {order.amount || order.amount === 0 ? ` · ₹${order.amount}` : ''}
                  </Typography>
                </div>
                <div className='flex items-center gap-2'>
                  <Chip size='small' label={order.status.replace(/_/g, ' ')} color={STATUS_COLORS[order.status] || 'default'} />
                  <Button size='small' onClick={() => toggleTrail(order)}>
                    {expandedId === rowKey ? 'Hide Trail' : 'View Trail'}
                  </Button>
                </div>
              </div>

              {order.paymentStatus === 'PAID' && order.targetId && REVIEWABLE_TYPES.has(order.type) && (
                <div className='mt-3'>
                  <WriteReviewDialog
                    orderType={order.type as 'CHADHAVA' | 'EPUJA' | 'KUNDLI' | 'JYOTISH' | 'ECOMMERCE'}
                    orderId={order.id}
                    itemLabel={order.label}
                  />
                </div>
              )}

              {order.videoUrl && !order.videoExpired && (
                <Alert severity='success' className='mt-3'>
                  Your offering video is ready —{' '}
                  <a href={order.videoUrl} target='_blank' rel='noreferrer' className='font-semibold'>
                    watch / download it here
                  </a>
                  . It will be removed from this page 48 hours after upload, so please save it now.
                </Alert>
              )}
              {order.videoExpired && (
                <Alert severity='info' className='mt-3'>
                  Your offering video was available for 48 hours after upload and has since been removed. It was emailed to you at upload time.
                </Alert>
              )}

              <Collapse in={expandedId === rowKey}>
                <div className='mt-4 pt-4' style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                  {trailLoading ? (
                    <CircularProgress size={18} />
                  ) : trail.length === 0 ? (
                    <Typography variant='body2' style={{ color: '#6b7280' }}>
                      No status history yet.
                    </Typography>
                  ) : (
                    <div className='flex flex-col gap-2'>
                      {trail.map((entry: TrailEntry) => (
                        <div key={entry.id} className='flex items-center gap-3'>
                          <Chip size='small' label={entry.status.replace(/_/g, ' ')} color={STATUS_COLORS[entry.status] || 'default'} />
                          <Typography variant='caption' style={{ color: '#6b7280' }}>
                            {new Date(entry.createdAt).toLocaleString('en-IN')}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Collapse>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const MyOrdersPage = () => {
  const { data: session, status: sessionStatus } = useSession()
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailLoading, setTrailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      if (sessionStatus === 'unauthenticated') setLoading(false)
      return
    }

    fetch('/api/my-orders')
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || 'Failed to load your orders.')
        setOrders(Array.isArray(data) ? data : [])
      })
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'Failed to load your orders.'))
      .finally(() => setLoading(false))
  }, [sessionStatus])

  const toggleTrail = async (order: MyOrder) => {
    const rowKey = `${order.type}-${order.id}`

    if (expandedId === rowKey) {
      setExpandedId(null)
      return
    }

    setExpandedId(rowKey)
    setTrailLoading(true)

    try {
      const res = await fetch(`/api/orders/trail?type=${order.type}&id=${order.id}`)
      const data = await res.json().catch(() => [])
      setTrail(Array.isArray(data) ? data : [])
    } finally {
      setTrailLoading(false)
    }
  }

  return (
    <div className='galaxy-bg stars-overlay min-h-screen py-24 px-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-12'>
          <Typography variant='h2' className='font-bold mb-4 galaxy-glow-text' style={{ color: '#006241' }}>
            My Account
          </Typography>
          <Typography variant='body1' style={{ color: '#374151' }}>
            Manage your profile, addresses, and track all your orders.
          </Typography>
        </div>

        {sessionStatus === 'unauthenticated' && (
          <Alert severity='info'>
            Please <Link href='/login' className='font-semibold'>log in</Link> to view your account.
          </Alert>
        )}

        {sessionStatus === 'authenticated' && (
          <Card className='mb-8 shadow-sm'>
            <Tabs 
              value={activeTab} 
              onChange={(e, val) => setActiveTab(val)}
              variant="fullWidth"
              sx={{ '& .MuiTab-root.Mui-selected': { color: '#006241', fontWeight: 'bold' }, '& .MuiTabs-indicator': { backgroundColor: '#006241' } }}
            >
              <Tab label="My Profile" />
              <Tab label="Saved Addresses" />
              <Tab label="My Orders" />
            </Tabs>
          </Card>
        )}

        {sessionStatus === 'authenticated' && (
          <Box>
            {activeTab === 0 && <ProfileTab />}
            {activeTab === 1 && <AddressesTab />}
            {activeTab === 2 && (
              <OrdersTab 
                orders={orders}
                loading={loading}
                errorMsg={errorMsg}
                expandedId={expandedId}
                trail={trail}
                trailLoading={trailLoading}
                toggleTrail={toggleTrail}
              />
            )}
          </Box>
        )}
      </div>
    </div>
  )
}

export default MyOrdersPage
