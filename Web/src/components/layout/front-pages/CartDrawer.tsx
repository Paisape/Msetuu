'use client'

import { useState } from 'react'

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
      setShippingAddress('')
    }
  }

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
          🛒 Sacred Cart ({totalItems})
        </Typography>
        <IconButton onClick={() => setCartOpen(false)} className='text-slate-400 hover:text-white'>
          <i className='tabler-x' />
        </IconButton>
      </Box>

      {cart.length === 0 ? (
        <Box className='flex-1 flex flex-col items-center justify-center text-center p-6'>
          <i className='tabler-shopping-cart text-5xl text-slate-500 mb-4 animate-pulse' />
          <Typography className='text-slate-400 font-semibold mb-2'>Your cart is empty</Typography>
          <Typography className='text-slate-500 text-xs'>
            Add Pujas, Chadhavas, or Gemstones to start your spiritual journey.
          </Typography>
        </Box>
      ) : (
        <Box className='flex flex-col h-full justify-between mt-4 overflow-y-auto'>
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
            {checkoutErrors && (
              <Alert severity='error' className='mb-3' onClose={() => setCheckoutErrors(null)}>
                {checkoutErrors.join(' ')}
              </Alert>
            )}
            {needsShippingAddress && (
              <TextField
                size='small'
                fullWidth
                label='Shipping Address (for physical items)'
                placeholder='House No, Street, City, Pin code'
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                className='mb-3'
                sx={{
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(6,182,212,0.3)' } }
                }}
              />
            )}
            <div className='flex justify-between items-center mb-6'>
              <Typography className='text-slate-300 font-semibold'>Total Payable:</Typography>
              <Typography variant='h5' className='font-bold text-white galaxy-glow-text'>
                ₹{totalAmount}
              </Typography>
            </div>
            <Button
              onClick={handleCheckout}
              disabled={submitting}
              className='galaxy-glow-btn w-full font-bold py-3 text-md'
            >
              {submitting ? <CircularProgress size={20} className='text-white' /> : 'Proceed to Checkout'}
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  )
}

export default CartDrawer
