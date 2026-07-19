'use client'

import { createContext, useContext, useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  type: 'chadhava' | 'puja' | 'product' | 'kundli' | 'offer'
  details?: any

  // Exactly what's needed to create the real backend order for this line at checkout time —
  // e.g. { chadhavaListingId } / { pujaListingId, pujaPackageId } / { productId, carat }.
  orderPayload?: Record<string, any>
}

export type CheckoutResult = {
  success: boolean
  errors?: string[]
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, q: number) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  checkout: (opts?: { shippingAddress?: string }) => Promise<CheckoutResult>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  // Load cart from localStorage
  useEffect(() => {
    const localCart = localStorage.getItem('mandir_setu_cart')

    if (localCart) {
      try {
        setCart(JSON.parse(localCart))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('mandir_setu_cart', JSON.stringify(newCart))
  }

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    const existingIndex = cart.findIndex((i) => i.id === item.id)

    if (existingIndex > -1) {
      const newCart = [...cart]

      newCart[existingIndex].quantity += 1
      saveCart(newCart)
    } else {
      saveCart([...cart, { ...item, quantity: 1 }])
    }

    setCartOpen(true) // Open cart drawer automatically on adding
  }

  const removeFromCart = (id: string) => {
    saveCart(cart.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, q: number) => {
    if (q <= 0) {
      removeFromCart(id)
      
return
    }

    saveCart(
      cart.map((i) => (i.id === id ? { ...i, quantity: q } : i))
    )
  }

  const clearCart = () => {
    saveCart([])
  }

  // Places a real backend order (PENDING) for every line in the cart, then runs Razorpay
  // Sandbox Checkout for that order and verifies the payment signature before moving to the
  // next line. An order only becomes PAID after /api/payment/verify confirms it.
  // Devotee/shipping details captured via each page's "Configure & Add to Cart" dialog travel
  // in `item.details`; quick "Add to Cart" lines fall back to the logged-in user's name and
  // placeholder values, which is a known simplification worth revisiting once real checkout
  // forms collect this up front for every line.
  const checkout = async (opts?: { shippingAddress?: string }): Promise<CheckoutResult> => {
    if (!session) {
      setCartOpen(false)
      router.push('/login?redirectTo=/front-pages/landing-page')
      
return { success: false, errors: ['You must be logged in to checkout.'] }
    }

    if (cart.length === 0) return { success: false, errors: ['Your cart is empty.'] }

    try {
      const { loadRazorpayScript } = await import('@/libs/razorpayClient')
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded) {
        return { success: false, errors: ['Failed to load Razorpay payment SDK. Check your internet connection.'] }
      }
    } catch {
      return { success: false, errors: ['Failed to initialize payment gateway scripts.'] }
    }

    const errors: string[] = []

    for (const item of cart) {
      const d = item.details || {}
      const fallbackName = d.name || session.user?.name || 'Devotee'
      const fallbackDob = d.dob || new Date().toISOString().slice(0, 10)

      try {
        let res: Response
        let orderType: 'CHADHAVA' | 'EPUJA' | 'ECOMMERCE' | 'OFFER'

        if (item.type === 'chadhava') {
          orderType = 'CHADHAVA'

          const fallbackPersons = Array.isArray(d.persons) && d.persons.length > 0
            ? d.persons
            : [{ name: fallbackName, gotra: '' }]

          res = await fetch('/api/chadhava', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chadhavaListingId: item.orderPayload?.chadhavaListingId,
              name: fallbackName,
              gender: d.gender || 'Other',
              dob: fallbackDob,
              birthPlace: d.birthPlace || 'Not specified',
              comment: d.comment,
              persons: fallbackPersons
            })
          })
        } else if (item.type === 'puja') {
          orderType = 'EPUJA'
          res = await fetch('/api/epuja', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pujaListingId: item.orderPayload?.pujaListingId,
              pujaPackageId: item.orderPayload?.pujaPackageId,
              name: fallbackName,
              gender: d.gender || 'Other',
              dob: fallbackDob,
              birthPlace: d.birthPlace || 'Not specified',
              comment: d.comment,
              devotees: d.devotees
            })
          })
        } else if (item.type === 'product') {
          orderType = 'ECOMMERCE'
          res = await fetch('/api/ecommerce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.orderPayload?.productId,
              carat: item.orderPayload?.carat,
              quantity: d.quantity || item.quantity,
              address: d.shippingAddress || opts?.shippingAddress || 'Not specified — please contact customer'
            })
          })
        } else if (item.type === 'offer') {
          orderType = 'OFFER'
          res = await fetch(`/api/offer/${item.orderPayload?.offerSlug}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: fallbackName,
              email: d.email || session.user?.email || 'devotee@example.com',
              phone: d.phone || '9999999999',
              comment: d.comment || ''
            })
          })
        } else {
          continue
        }

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          errors.push(`${item.name}: ${data?.error || 'Failed to place order.'}`)
          continue
        }

        // Trigger Razorpay Sandbox checkout for this order
        const { id: rzpOrderId, amount, currency, key } = data.razorpayOrder
        const orderId = data.order.id

        await new Promise<void>(async (resolve, reject) => {
          try {
            const { openRazorpayCheckout } = await import('@/libs/razorpayClient')

            openRazorpayCheckout({
              key,
              amount,
              currency,
              name: 'Mandir Setu',
              description: `Payment for ${item.name}`,
              order_id: rzpOrderId,
              prefill: {
                name: fallbackName
              },
              handler: async function (paymentResponse) {
                try {
                  const verifyRes = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderType,
                      orderId,
                      razorpayPaymentId: paymentResponse.razorpay_payment_id,
                      razorpayOrderId: paymentResponse.razorpay_order_id,
                      razorpaySignature: paymentResponse.razorpay_signature
                    })
                  })

                  const verifyData = await verifyRes.json().catch(() => null)

                  if (!verifyRes.ok) {
                    reject(new Error(verifyData?.error || 'Payment signature verification failed.'))
                  } else {
                    resolve()
                  }
                } catch (err) {
                  reject(err)
                }
              },
              modal: {
                ondismiss: () => {
                  reject(new Error('Payment cancelled by customer.'))
                }
              }
            })
          } catch (err) {
            reject(err)
          }
        })

      } catch (err) {
        errors.push(`${item.name}: ${err instanceof Error ? err.message : 'Network error occurred during payment.'}`)
      }
    }

    if (errors.length === 0) {
      clearCart()
      setCartOpen(false)
      
return { success: true }
    }

    return { success: false, errors }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartOpen,
        setCartOpen,
        checkout
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  
return context
}

export default CartContext
