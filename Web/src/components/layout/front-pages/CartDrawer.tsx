'use client'

import { useState, useEffect } from 'react'

import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'

import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

import classnames from 'classnames'

const CartDrawer = () => {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, checkout } = useCart()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [shippingAddress, setShippingAddress] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<string[]>([])
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | 'new'>('new')
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [checkoutErrors, setCheckoutErrors] = useState<string[] | null>(null)
  const [successOrderIds, setSuccessOrderIds] = useState<string[] | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1)

  // Auto open cart if url has openCart=1
  useEffect(() => {
    if (searchParams.get('openCart') === '1') {
      setCartOpen(true)
      // Clean query parameter from URL bar
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, setCartOpen])

  // Reset states when drawer opens
  useEffect(() => {
    if (cartOpen) {
      setCheckoutStep(1)
      setCheckoutErrors(null)
      setSelectedAddressIndex('new')
      if (session) {
        fetchSavedAddresses()
      }
    }
  }, [cartOpen, session])

  const fetchSavedAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const res = await fetch('/api/my-orders/addresses')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setSavedAddresses(data)
        setSelectedAddressIndex(0)
        setShippingAddress(data[0])
      } else {
        setSavedAddresses([])
        setSelectedAddressIndex('new')
        setShippingAddress('')
      }
    } catch (e) {
      console.error('Failed to load saved addresses', e)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  const needsShippingAddress = cart.some(item => item.type === 'product')

  const handleCheckout = async () => {
    setSubmitting(true)
    setCheckoutErrors(null)

    const finalAddress = needsShippingAddress ? shippingAddress : ''
    const result = await checkout({ shippingAddress: finalAddress })

    setSubmitting(false)

    if (!result.success && result.errors) {
      setCheckoutErrors(result.errors)
    } else if (result.success) {
      setSuccessOrderIds(result.orderIds || [])
      setShippingAddress('')
      setCheckoutStep(1)
    }
  }

  const handleAddressSelect = (index: number | 'new') => {
    setSelectedAddressIndex(index)
    if (index === 'new') {
      setShippingAddress('')
    } else {
      setShippingAddress(savedAddresses[index])
    }
  }

  const renderCartItems = () => (
    <Box className='flex flex-col h-full justify-between mt-4 overflow-hidden'>
      <List className='flex-1 pr-1 overflow-y-auto' sx={{ maxHeight: 'calc(100vh - 250px)' }}>
        {cart.map((item) => (
          <Box key={item.id} className='mb-4'>
            <ListItem className='p-0 flex gap-4 items-start justify-between'>
              <div className='flex gap-3 items-center'>
                <img src={item.image} alt={item.name} className='w-12 h-12 object-cover rounded border border-emerald-500/20' />
                <div>
                  <Typography className='text-sm font-bold text-slate-800 max-w-[180px] truncate'>
                    {item.name}
                  </Typography>
                  <Typography variant='caption' className='text-emerald-700 font-bold block capitalize'>
                    Type: {item.type}
                  </Typography>
                  <Typography className='text-sm font-bold text-slate-600'>
                    ₹{item.price}
                  </Typography>
                </div>
              </div>

              <div className='flex flex-col items-end justify-between h-full min-h-[50px]'>
                <IconButton size='small' onClick={() => removeFromCart(item.id)} className='text-rose-500 hover:text-rose-700'>
                  <i className='tabler-trash text-sm' />
                </IconButton>
                <div className='flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded px-1 mt-2'>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className='text-slate-500 hover:text-slate-800 px-1 text-xs font-bold'
                  >
                    -
                  </button>
                  <span className='text-xs font-bold px-1 text-slate-800'>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className='text-slate-500 hover:text-slate-800 px-1 text-xs font-bold'
                  >
                    +
                  </button>
                </div>
              </div>
            </ListItem>
            <Divider className='border-slate-100 mt-3' />
          </Box>
        ))}
      </List>

      <Box className='border-t border-slate-100 pt-4 mt-auto'>
        <div className='flex justify-between items-center mb-6'>
          <Typography className='text-slate-600 font-semibold'>Total Payable:</Typography>
          <Typography variant='h5' className='font-bold text-emerald-800'>
            ₹{totalAmount}
          </Typography>
        </div>
        
        {!session ? (
          <Box className='bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-4'>
            <Typography variant='body2' className='text-amber-800 font-semibold mb-3'>
              You must be logged in to proceed with payment and order tracking.
            </Typography>
            <Button
              variant='contained'
              color='success'
              fullWidth
              onClick={() => {
                setCartOpen(false)
                router.push('/login?redirectTo=/front-pages/landing-page?openCart=1')
              }}
              className='bg-emerald-600 hover:bg-emerald-700 font-bold py-2'
            >
              Login / Create Account
            </Button>
          </Box>
        ) : (
          <Button
            onClick={() => setCheckoutStep(2)}
            className='w-full font-bold py-3 text-md text-white bg-emerald-600 hover:bg-emerald-700'
            style={{ borderRadius: '12px' }}
          >
            {needsShippingAddress ? 'Proceed to Address Details' : 'Proceed to Checkout'}
          </Button>
        )}
      </Box>
    </Box>
  )

  const renderAddressStep = () => (
    <Box className='flex flex-col h-full mt-4'>
      <Button 
        onClick={() => setCheckoutStep(1)} 
        className='self-start text-emerald-700 mb-4 hover:bg-emerald-50 font-bold'
        startIcon={<i className='tabler-arrow-left' />}
      >
        Back to Cart
      </Button>

      <Box className='flex-1 overflow-y-auto pr-1'>
        <Typography variant='h6' className='text-slate-800 font-bold mb-4'>Checkout Details</Typography>
        
        {checkoutErrors && (
          <Alert severity='error' className='mb-4' onClose={() => setCheckoutErrors(null)}>
            {checkoutErrors.join(' ')}
          </Alert>
        )}

        {needsShippingAddress ? (
          <Box className='mb-6'>
            <Typography variant='subtitle2' className='text-slate-700 font-bold mb-3'>
              Select Shipping Address
            </Typography>

            {loadingAddresses ? (
              <Box className='text-center py-4'>
                <CircularProgress size={20} color='success' />
              </Box>
            ) : (
              <FormControl component='fieldset' className='w-full mb-4'>
                <RadioGroup
                  value={selectedAddressIndex}
                  onChange={(e) => {
                    const val = e.target.value
                    handleAddressSelect(val === 'new' ? 'new' : Number(val))
                  }}
                  className='flex flex-col gap-2'
                >
                  {savedAddresses.map((addr, idx) => (
                    <Box 
                      key={idx} 
                      className={classnames(
                        'border rounded-xl p-3 flex items-start gap-2 cursor-pointer transition-all',
                        selectedAddressIndex === idx ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:bg-slate-50'
                      )}
                      onClick={() => handleAddressSelect(idx)}
                    >
                      <Radio 
                        value={idx} 
                        checked={selectedAddressIndex === idx}
                        sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' }, p: 0, mt: '2px' }} 
                      />
                      <Typography variant='body2' className='text-slate-700 text-left font-medium line-clamp-3'>
                        {addr}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Box 
                    className={classnames(
                      'border rounded-xl p-3 flex items-start gap-2 cursor-pointer transition-all',
                      selectedAddressIndex === 'new' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:bg-slate-50'
                    )}
                    onClick={() => handleAddressSelect('new')}
                  >
                    <Radio 
                      value='new' 
                      checked={selectedAddressIndex === 'new'}
                      sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' }, p: 0, mt: '2px' }} 
                    />
                    <Box className='text-left'>
                      <Typography variant='body2' className='text-slate-800 font-bold'>
                        Use a New Address
                      </Typography>
                    </Box>
                  </Box>
                </RadioGroup>
              </FormControl>
            )}

            {selectedAddressIndex === 'new' && (
              <TextField
                size='small'
                fullWidth
                multiline
                rows={3}
                label='New Shipping Address'
                placeholder='House No, Street, City, State, Pin code'
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                sx={{
                  mt: 1,
                  '& .MuiInputLabel-root': { color: '#64748b' },
                  '& .MuiOutlinedInput-root': { 
                    color: '#1e293b', 
                    '& fieldset': { borderColor: 'rgba(16,185,129,0.3)' },
                    '&:hover fieldset': { borderColor: '#10b981' }
                  }
                }}
              />
            )}
          </Box>
        ) : (
          <Box className='mb-6 text-center py-8 bg-emerald-50/40 border border-emerald-500/20 rounded-xl'>
            <i className='tabler-bolt text-4xl text-emerald-600 mb-2 block' />
            <Typography className='text-slate-700 font-semibold px-4'>
              No physical shipping required for these items. You're ready to complete the payment!
            </Typography>
          </Box>
        )}
      </Box>

      <Box className='border-t border-slate-100 pt-4 mt-auto'>
        <div className='flex justify-between items-center mb-6'>
          <Typography className='text-slate-600 font-semibold'>Total Payable:</Typography>
          <Typography variant='h5' className='font-bold text-emerald-800'>
            ₹{totalAmount}
          </Typography>
        </div>
        <Button
          onClick={handleCheckout}
          disabled={submitting || (needsShippingAddress && shippingAddress.trim().length < 5)}
          className='w-full font-bold py-3 text-md text-white bg-emerald-600 hover:bg-emerald-700'
          style={{ borderRadius: '12px' }}
        >
          {submitting ? <CircularProgress size={20} className='text-white' /> : 'Proceed to Payment'}
        </Button>
      </Box>
    </Box>
  )

  return (
    <Drawer
      anchor='right'
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      PaperProps={{
        className: 'galaxy-card w-96 p-4 border-l border-emerald-500/30'
      }}
    >
      <Box className='flex justify-between items-center pb-4 border-b border-slate-100'>
        <Typography variant='h5' className='font-bold text-slate-800 flex items-center gap-2'>
          🛒 Sacred Cart {checkoutStep === 1 ? `(${totalItems})` : ''}
        </Typography>
        <IconButton onClick={() => setCartOpen(false)} className='text-slate-400 hover:text-slate-800'>
          <i className='tabler-x' />
        </IconButton>
      </Box>

      {successOrderIds ? (
        <Box className='flex-1 flex flex-col items-center justify-center text-center p-6 gap-4'>
          <i className='tabler-circle-check text-5xl text-emerald-500 animate-bounce' />
          <Typography variant='h5' className='text-emerald-700 font-bold'>🎉 Payment Successful!</Typography>
          <Typography className='text-slate-600 text-sm'>
            Thank you for your devotion. Your order has been placed.
          </Typography>
          <Box className='bg-slate-50 border border-emerald-500/30 rounded-xl p-4 w-full text-left'>
            <Typography variant='caption' className='text-slate-500 block font-semibold mb-1'>ORDER ID(S):</Typography>
            {successOrderIds.map(id => (
              <Typography key={id} className='text-xs font-mono text-emerald-800 select-all mb-1'>
                {id}
              </Typography>
            ))}
          </Box>
          <Typography className='text-slate-500 text-xs mt-2'>
            A confirmation email has been sent. You can track this in your Profile &gt; My Orders.
          </Typography>
          <Button 
            fullWidth 
            variant='contained' 
            className='mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
            onClick={() => {
              setSuccessOrderIds(null)
              setCartOpen(false)
            }}
          >
            Done
          </Button>
        </Box>
      ) : cart.length === 0 ? (
        <Box className='flex-1 flex flex-col items-center justify-center text-center p-6'>
          <i className='tabler-shopping-cart text-5xl text-slate-400 mb-4 animate-pulse' />
          <Typography className='text-slate-700 font-semibold mb-2'>Your cart is empty</Typography>
          <Typography className='text-slate-500 text-xs'>
            Add Pujas, Chadhavas, or Gemstones to start your spiritual journey.
          </Typography>
        </Box>
      ) : (
        checkoutStep === 1 ? renderCartItems() : renderAddressStep()
      )}
    </Drawer>
  )
}

export default CartDrawer
