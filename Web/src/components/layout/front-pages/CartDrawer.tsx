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

import { useCart } from '@/contexts/CartContext'

const CartDrawer = () => {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, checkout } = useCart()
  const [shippingAddress, setShippingAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkoutErrors, setCheckoutErrors] = useState<string[] | null>(null)
  const [successOrderIds, setSuccessOrderIds] = useState<string[] | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1)

  // Reset to step 1 when drawer opens
  useEffect(() => {
    if (cartOpen) {
      setCheckoutStep(1)
      setCheckoutErrors(null)
    }
  }, [cartOpen])

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  const needsShippingAddress = cart.some(item => item.type === 'product' && !item.details?.shippingAddress)

  const handleCheckout = async () => {
    setSubmitting(true)
    setCheckoutErrors(null)

    const result = await checkout({ shippingAddress })

    setSubmitting(false)

    if (!result.success && result.errors) {
      setCheckoutErrors(result.errors)
    } else if (result.success) {
      setSuccessOrderIds(result.orderIds || [])
      setShippingAddress('')
      setCheckoutStep(1) // Reset for future
    }
  }

  const renderCartItems = () => (
    <Box className='flex flex-col h-full justify-between mt-4 overflow-hidden'>
      <List className='flex-1 pr-1 overflow-y-auto' sx={{ maxHeight: 'calc(100vh - 250px)' }}>
        {cart.map((item) => (
          <Box key={item.id} className='mb-4'>
            <ListItem className='p-0 flex gap-4 items-start justify-between'>
              <div className='flex gap-3 items-center'>
                <img src={item.image} alt={item.name} className='w-12 h-12 object-cover rounded border border-cyan-500/20' />
                <div>
                  <Typography className='text-sm font-bold text-white max-w-[180px] truncate'>
                    {item.name}
                  </Typography>
                  <Typography variant='caption' className='text-cyan-400 font-semibold block capitalize'>
                    Type: {item.type}
                  </Typography>
                  <Typography className='text-sm font-bold text-slate-300'>
                    ₹{item.price}
                  </Typography>
                </div>
              </div>

              <div className='flex flex-col items-end justify-between h-full min-h-[50px]'>
                <IconButton size='small' onClick={() => removeFromCart(item.id)} className='text-rose-400 hover:text-rose-300'>
                  <i className='tabler-trash text-sm' />
                </IconButton>
                <div className='flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/25 rounded px-1 mt-2'>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className='text-slate-400 hover:text-white px-1 text-xs'
                  >
                    -
                  </button>
                  <span className='text-xs font-bold px-1'>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className='text-slate-400 hover:text-white px-1 text-xs'
                  >
                    +
                  </button>
                </div>
              </div>
            </ListItem>
            <Divider className='border-cyan-500/10 mt-3' />
          </Box>
        ))}
      </List>

      <Box className='border-t border-cyan-500/10 pt-4 mt-auto'>
        <div className='flex justify-between items-center mb-6'>
          <Typography className='text-slate-300 font-semibold'>Total Payable:</Typography>
          <Typography variant='h5' className='font-bold text-white galaxy-glow-text'>
            ₹{totalAmount}
          </Typography>
        </div>
        <Button
          onClick={() => setCheckoutStep(2)}
          className='galaxy-glow-btn w-full font-bold py-3 text-md'
        >
          {needsShippingAddress ? 'Proceed to Address Details' : 'Proceed to Checkout'}
        </Button>
      </Box>
    </Box>
  )

  const renderAddressStep = () => (
    <Box className='flex flex-col h-full mt-4'>
      <Button 
        onClick={() => setCheckoutStep(1)} 
        className='self-start text-cyan-400 mb-4 hover:bg-cyan-900/30'
        startIcon={<i className='tabler-arrow-left' />}
      >
        Back to Cart
      </Button>

      <Box className='flex-1 overflow-y-auto pr-1'>
        <Typography variant='h6' className='text-white mb-4'>Checkout Details</Typography>
        
        {checkoutErrors && (
          <Alert severity='error' className='mb-4' onClose={() => setCheckoutErrors(null)}>
            {checkoutErrors.join(' ')}
          </Alert>
        )}

        {needsShippingAddress ? (
          <Box className='mb-6'>
            <Typography variant='body2' className='text-slate-300 mb-3'>
              You have physical items in your cart. Please provide a shipping address.
            </Typography>
            <TextField
              size='small'
              fullWidth
              multiline
              rows={3}
              label='Shipping Address'
              placeholder='House No, Street, City, State, Pin code'
              value={shippingAddress}
              onChange={e => setShippingAddress(e.target.value)}
              sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(6,182,212,0.3)' } }
              }}
            />
          </Box>
        ) : (
          <Box className='mb-6 text-center py-8 bg-cyan-950/20 border border-cyan-500/20 rounded-lg'>
            <i className='tabler-bolt text-4xl text-cyan-400 mb-2' />
            <Typography className='text-slate-300'>
              No physical shipping required for these items. You're ready to complete the payment!
            </Typography>
          </Box>
        )}
      </Box>

      <Box className='border-t border-cyan-500/10 pt-4 mt-auto'>
        <div className='flex justify-between items-center mb-6'>
          <Typography className='text-slate-300 font-semibold'>Total Payable:</Typography>
          <Typography variant='h5' className='font-bold text-white galaxy-glow-text'>
            ₹{totalAmount}
          </Typography>
        </div>
        <Button
          onClick={handleCheckout}
          disabled={submitting || (needsShippingAddress && shippingAddress.trim().length < 5)}
          className='galaxy-glow-btn w-full font-bold py-3 text-md'
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
        className: 'galaxy-card text-white w-96 p-4 border-l border-cyan-500/30'
      }}
    >
      <Box className='flex justify-between items-center pb-4 border-b border-cyan-500/10'>
        <Typography variant='h5' className='font-bold text-white flex items-center gap-2'>
          🛒 Sacred Cart {checkoutStep === 1 ? `(${totalItems})` : ''}
        </Typography>
        <IconButton onClick={() => setCartOpen(false)} className='text-slate-400 hover:text-white'>
          <i className='tabler-x' />
        </IconButton>
      </Box>

      {successOrderIds ? (
        <Box className='flex-1 flex flex-col items-center justify-center text-center p-6 gap-4'>
          <i className='tabler-circle-check text-5xl text-emerald-500 animate-bounce' />
          <Typography variant='h5' className='text-emerald-400 font-bold'>🎉 Payment Successful!</Typography>
          <Typography className='text-slate-300 text-sm'>
            Thank you for your devotion. Your order has been placed.
          </Typography>
          <Box className='bg-slate-900/50 border border-emerald-500/30 rounded-lg p-4 w-full text-left'>
            <Typography variant='caption' className='text-slate-400 block font-semibold mb-1'>ORDER ID(S):</Typography>
            {successOrderIds.map(id => (
              <Typography key={id} className='text-xs font-mono text-emerald-300 select-all mb-1'>
                {id}
              </Typography>
            ))}
          </Box>
          <Typography className='text-slate-400 text-xs mt-2'>
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
          <i className='tabler-shopping-cart text-5xl text-slate-500 mb-4 animate-pulse' />
          <Typography className='text-slate-400 font-semibold mb-2'>Your cart is empty</Typography>
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
