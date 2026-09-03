'use client'

import { useState, useEffect, useRef } from 'react'
import { getMergedDevoteeList, calculateDynamicCounter, SAMPLE_DEVOTEES } from '@/libs/socialProof'

type Devotee = {
  name: string
  gotra: string
  dob: string
  phone: string
  email: string
  pincode?: string
  locality?: string
  city?: string
  state?: string
}

type Props = {
  offerLink: {
    id: string
    title: string
    offerPrice: string
    salePrice: string
    gstIncluded: boolean
    gstRate: string
    supportPhone?: string
    initialCounter?: number
    displayCounter?: number
    recentBookings?: { name: string; city: string }[]
  }
}

const translations = {
  en: {
    bookNow: 'Book Now',
    devoteeDetails: 'Enter Devotee Details',
    primaryContact: 'Primary Contact',
    name: 'Devotee Name *',
    gotra: 'Gotra (Optional)',
    dob: 'Date of Birth (Optional)',
    phone: 'Mobile / WhatsApp No *',
    email: 'Email ID (Optional)',
    pincode: 'Pincode (6-Digits)',
    locality: 'Locality / Area',
    city: 'City / District',
    state: 'State',
    addPerson: 'Add Extra Person',
    price: 'Price',
    gst: 'GST',
    total: 'Total Amount',
    payConfirm: 'Pay & Confirm Booking',
    successTitle: 'Booking Confirmed!',
    successDesc: 'Your offering has been booked successfully. Details have been registered.',
    cancel: 'Cancel',
    processing: 'Processing...',
    person: 'Person',
    sameAsPrimary: 'Same as primary',
    orderIdLabel: 'Order ID',
    supportContact: 'For details contact:',
    devoteesBooked: 'Devotees Booked',
    limitedSlots: '⚡ Limited Vedic Slots Remaining!'
  },
  hi: {
    bookNow: 'अभी बुक करें',
    devoteeDetails: 'श्रद्धालु का विवरण दर्ज करें',
    primaryContact: 'मुख्य संपर्क',
    name: 'श्रद्धालु का नाम *',
    gotra: 'गोत्र (वैकल्पिक)',
    dob: 'जन्म तिथि (वैकल्पिक)',
    phone: 'मोबाइल / व्हाट्सएप नंबर *',
    email: 'ईमेल आईडी (वैकल्पिक)',
    pincode: 'पिनकोड (6 अंक)',
    locality: 'इलाका / क्षेत्र',
    city: 'शहर / जिला',
    state: 'राज्य',
    addPerson: 'अतिरिक्त व्यक्ति जोड़ें',
    price: 'मूल्य',
    gst: 'जीएसटी',
    total: 'कुल राशि',
    payConfirm: 'भुगतान करें और बुकिंग सुरक्षित करें',
    successTitle: 'बुकिंग की पुष्टि हो गई!',
    successDesc: 'आपकी सेवा सफलतापूर्वक बुक हो गई है। विवरण दर्ज कर लिया गया है।',
    cancel: 'रद्द करें',
    processing: 'प्रक्रिया जारी है...',
    person: 'व्यक्ति',
    sameAsPrimary: 'मुख्य नंबर के समान',
    orderIdLabel: 'ऑर्डर आईडी',
    supportContact: 'विवरण के लिए संपर्क करें:',
    devoteesBooked: 'श्रद्धालु सेवा बुक कर चुके हैं',
    limitedSlots: '⚡ केवल सीमित वैदिक स्थान शेष!'
  },
  mr: {
    bookNow: 'आताच बुक करा',
    devoteeDetails: 'श्रद्धाळू तपशील प्रविष्ट करा',
    primaryContact: 'मुख्य संपर्क',
    name: 'श्रद्धाळूचे नाव *',
    gotra: 'गोत्र (पर्यायी)',
    dob: 'जन्म तारीख (पर्यायी)',
    phone: 'मोबाईल / व्हॉट्सॲप नंबर *',
    email: 'ईमेल आयडी (वैकल्पिक)',
    pincode: 'पिनकोड (6 अंक)',
    locality: 'परिसर / भाग',
    city: 'शहर / जिल्हा',
    state: 'राज्य',
    addPerson: 'अतिरिक्त व्यक्ती जोडा',
    price: 'किंमत',
    gst: 'जीएसटी',
    total: 'एकूण रक्कम',
    payConfirm: 'पैसे द्या आणि बुकिंग निश्चित करा',
    successTitle: 'बुकिंगची पुष्टी झाली!',
    successDesc: 'तुमची सेवा यशस्वीरित्या बुक झाली आहे. तपशील नोंदवले गेले आहेत.',
    cancel: 'रद्द करा',
    processing: 'प्रक्रिया सुरू आहे...',
    person: 'व्यक्ती',
    sameAsPrimary: 'मुख्य नंबर प्रमाणे',
    orderIdLabel: 'ऑर्डर आयडी',
    supportContact: 'अधिक माहितीसाठी संपर्क करा:',
    devoteesBooked: 'श्रद्धळूंची बुकिंग पूर्ण झाली',
    limitedSlots: '⚡ फक्त मर्यादित वैदिक जागा शिल्लक!'
  },
  gu: {
    bookNow: 'અત્યારે જ બુક કરો',
    devoteeDetails: 'શ્રદ્ધાળુની વિગત દાખલ કરો',
    primaryContact: 'મુખ્ય સંપર્ક',
    name: 'શ્રદ્ધાળુનું નામ *',
    gotra: 'ગોત્ર (વૈકલ્પિક)',
    dob: 'જન્મ તારીખ (વૈકલ્પિક)',
    phone: 'મોબાઇલ / વોટ્સએપ નંબર *',
    email: 'ઈમેલ આઈડી (વૈકલ્પિક)',
    pincode: 'પિનકોડ (6 અંક)',
    locality: 'વિસ્તાર / સોસાયટી',
    city: 'શહેર / જિલ્લો',
    state: 'રાજ્ય',
    addPerson: 'વધારાની વ્યક્તિ ઉમેરો',
    price: 'કિંમત',
    gst: 'જીએસટી',
    total: 'કુલ રકમ',
    payConfirm: 'ચુકવણી કરો અને બુકિંગ સુરક્ષિત કરો',
    successTitle: 'બુકિંગ કન્ફર્મ થયું!',
    successDesc: 'તમારી સેવા સફળતાપૂર્વક બુક થઈ ગઈ છે. વિગતો નોંધી લેવામાં આવી છે.',
    cancel: 'રદ કરો',
    processing: 'પ્રક્રિયા ચાલુ છે...',
    person: 'વ્યક્તિ',
    sameAsPrimary: 'મુખ્ય નંબર મુજબ',
    orderIdLabel: 'ઓર્ડર આઈડી',
    supportContact: 'વિગતો માટે સંપર્ક કરો:'
  }
}

export default function OfferCheckoutModal({ offerLink }: Props) {
  const [lang, setLang] = useState<'en' | 'hi' | 'mr' | 'gu'>('hi') // Default to Hindi as requested
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [confirmedOrderId, setConfirmedOrderId] = useState('')
  const [gpsLocation, setGpsLocation] = useState<string | null>(null)
  const baseInitial = offerLink.initialCounter ?? 10000
  const [liveCounter, setLiveCounter] = useState<number>(() => {
    return offerLink.displayCounter || calculateDynamicCounter(baseInitial, 0)
  })

  // Full pool of rotating devotee names (deterministic on SSR, shuffled on client mount)
  const [rotatingDevotees, setRotatingDevotees] = useState<{ name: string; city: string }[]>(() => {
    const real = offerLink.recentBookings || []
    return real.length > 0 ? real : SAMPLE_DEVOTEES
  })
  const [activeBookingIdx, setActiveBookingIdx] = useState(0)
  const [isFading, setIsFading] = useState(false)

  // Randomize devotee list on client mount to prevent SSR hydration mismatch
  useEffect(() => {
    setRotatingDevotees(getMergedDevoteeList(offerLink.recentBookings || []))
  }, [offerLink.recentBookings])

  // 1. Automatic Devotee Name Rotation (every 3.8s with subtle fade animation)
  useEffect(() => {
    if (rotatingDevotees.length <= 1) return
    const timer = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setActiveBookingIdx(prev => (prev + 1) % rotatingDevotees.length)
        setIsFading(false)
      }, 250)
    }, 3800)
    return () => clearInterval(timer)
  }, [rotatingDevotees.length])

  const [devotees, setDevotees] = useState<Devotee[]>([
    { name: '', gotra: '', dob: '', phone: '', email: '' }
  ])

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          setGpsLocation(`${lat.toFixed(6)},${lon.toFixed(6)}`)
        },
        (err) => {
          console.warn('Geolocation permission not granted or error occurred:', err)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [isOpen])

  // Resolve partner name from code helper
  const resolvePartner = async (code: string) => {
    try {
      const res = await fetch(`/api/offers/referrals/resolve?code=${encodeURIComponent(code)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.partnerName) {
          setPartnerName(data.partnerName)
        }
      }
    } catch (e) {
      console.error('Failed to resolve partner name:', e)
    }
  }

  // Detect local language and load referral codes on mount
  useEffect(() => {
    // 1. Language auto-detection from custom HTML dropdown select
    let selectListenerCleanup: (() => void) | undefined

    const detectLanguageFromHTML = () => {
      const selects = document.querySelectorAll('select')
      for (const select of Array.from(selects)) {
        const options = Array.from(select.options)
        const hasLangOptions = options.some(opt => 
          opt.text.toLowerCase().includes('english') || 
          opt.text.toLowerCase().includes('हिन्दी') || 
          opt.text.toLowerCase().includes('hindi') ||
          opt.text.toLowerCase().includes('मराठी') ||
          opt.text.toLowerCase().includes('marathi') ||
          opt.text.toLowerCase().includes('ગુજરાતી') ||
          opt.text.toLowerCase().includes('gujarati')
        )
        
        if (hasLangOptions) {
          // Read initial state
          const val = select.value.toLowerCase()
          const selectedText = select.options[select.selectedIndex]?.text.toLowerCase() || ''
          
          if (val.includes('en') || selectedText.includes('english')) {
            setLang('en')
          } else if (val.includes('mr') || selectedText.includes('मराठी') || selectedText.includes('marathi')) {
            setLang('mr')
          } else if (val.includes('gu') || selectedText.includes('ગુજરાતી') || selectedText.includes('gujarati')) {
            setLang('gu')
          } else {
            setLang('hi')
          }

          // Register onChange listener
          const handleChange = () => {
            const newVal = select.value.toLowerCase()
            const newText = select.options[select.selectedIndex]?.text.toLowerCase() || ''
            if (newVal.includes('en') || newText.includes('english')) {
              setLang('en')
            } else if (newVal.includes('mr') || newText.includes('मराठी') || newText.includes('marathi')) {
              setLang('mr')
            } else if (newVal.includes('gu') || newText.includes('ગુજરાતી') || newText.includes('gujarati')) {
              setLang('gu')
            } else {
              setLang('hi')
            }
          }

          select.addEventListener('change', handleChange)
          selectListenerCleanup = () => select.removeEventListener('change', handleChange)
          return true
        }
      }
      return false
    }

    // Try detecting immediately, or set an interval to check if elements load late
    const detected = detectLanguageFromHTML()
    let detectionInterval: NodeJS.Timeout | undefined

    if (!detected) {
      detectionInterval = setInterval(() => {
        if (detectLanguageFromHTML()) {
          if (detectionInterval) clearInterval(detectionInterval)
        }
      }, 500)
    }

    // Dynamic poller to guarantee language sync regardless of DOM redraws
    const periodicSync = setInterval(() => {
      const selects = document.querySelectorAll('select')
      for (const select of Array.from(selects)) {
        const options = Array.from(select.options)
        const hasLangOptions = options.some(opt => 
          opt.text.toLowerCase().includes('english') || 
          opt.text.toLowerCase().includes('हिन्दी') || 
          opt.text.toLowerCase().includes('hindi') ||
          opt.text.toLowerCase().includes('मराठी') ||
          opt.text.toLowerCase().includes('marathi') ||
          opt.text.toLowerCase().includes('ગુજરાતી') ||
          opt.text.toLowerCase().includes('gujarati')
        )
        if (hasLangOptions) {
          const val = select.value.toLowerCase()
          const text = select.options[select.selectedIndex]?.text.toLowerCase() || ''
          if (val.includes('en') || text.includes('english')) {
            setLang((prev) => prev !== 'en' ? 'en' : prev)
          } else if (val.includes('mr') || text.includes('मराठी') || text.includes('marathi')) {
            setLang((prev) => prev !== 'mr' ? 'mr' : prev)
          } else if (val.includes('gu') || text.includes('ગુજરાતી') || text.includes('gujarati')) {
            setLang((prev) => prev !== 'gu' ? 'gu' : prev)
          } else {
            setLang((prev) => prev !== 'hi' ? 'hi' : prev)
          }
        }
      }
    }, 1000)

    // 2. Referral code resolution
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      const cleanRef = ref.trim().toUpperCase()
      setReferralCode(cleanRef)
      sessionStorage.setItem('msetu_offer_ref', cleanRef)
      resolvePartner(cleanRef)
    } else {
      const stored = sessionStorage.getItem('msetu_offer_ref')
      if (stored) {
        setReferralCode(stored)
        resolvePartner(stored)
      }
    }

    return () => {
      if (selectListenerCleanup) selectListenerCleanup()
      if (detectionInterval) clearInterval(detectionInterval)
      clearInterval(periodicSync)
    }
  }, [])

  const t = translations[lang]

  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState(false)

  const handleFieldChange = (index: number, field: keyof Devotee, value: string) => {
    setDevotees(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handlePincodeChange = async (index: number, pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6)
    setPincodeError(false)

    setDevotees(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], pincode: cleanPin }
      return updated
    })

    if (cleanPin.length === 6) {
      setPincodeLoading(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
        const data = await res.json()
        if (data && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0]
          const newDistrict = po.District || po.Division || ''
          const newState = po.State || ''
          const newLocality = po.Name || ''

          setDevotees(prev => {
            const updated = [...prev]
            updated[index] = {
              ...updated[index],
              pincode: cleanPin,
              city: newDistrict,
              state: newState,
              locality: newLocality
            }
            return updated
          })
          setPincodeError(false)
        } else {
          setPincodeError(true)
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err)
        setPincodeError(true)
      } finally {
        setPincodeLoading(false)
      }
    }
  }

  const addPerson = () => {
    setDevotees([...devotees, { name: '', gotra: '', dob: '', phone: devotees[0].phone, email: '' }])
  }

  const removePerson = (index: number) => {
    if (devotees.length === 1) return
    setDevotees(devotees.filter((_, i) => i !== index))
  }

  // Calculate pricing dynamics
  const basePrice = parseFloat(offerLink.offerPrice)
  const personCount = devotees.length
  const rawTotal = basePrice * personCount
  const gstRate = parseFloat(offerLink.gstRate)

  let finalAmount = 0
  let gstAmount = 0

  if (offerLink.gstIncluded) {
    finalAmount = rawTotal
    gstAmount = rawTotal - (rawTotal / (1 + gstRate / 100))
  } else {
    gstAmount = rawTotal * (gstRate / 100)
    finalAmount = rawTotal + gstAmount
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/offers/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerLinkId: offerLink.id,
          devotees,
          referralCode: referralCode || null,
          gpsLocation: gpsLocation || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate checkout.')
      }

      const { orderId, razorpayOrder } = data

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Mandir Setuu',
        description: offerLink.title,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          setLoading(true)
          try {
            const verifyRes = await fetch('/api/offers/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            setConfirmedOrderId(orderId)
            setSuccess(true)
            setIsOpen(false)
            const countToAdd = Math.max(1, devotees.length)
            setLiveCounter(prev => prev + countToAdd)
            
            // Add all entered devotees to rotating live ticker
            const newDevotees = devotees
              .filter(d => d.name?.trim())
              .map(d => ({
                name: d.name.trim(),
                city: [d.city, d.state].filter(Boolean).join(', ')
              }))

            if (newDevotees.length > 0) {
              setRotatingDevotees(prev => [...newDevotees, ...prev])
              setActiveBookingIdx(0)
            }
          } catch (err: any) {
            setError(err.message)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          contact: devotees[0].phone,
          email: devotees[0].email || ''
        },
        theme: {
          color: '#FF671F'
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          }
        }
      }

      if (!(window as any).Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        }
        document.body.appendChild(script)
      } else {
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Side Social Proof Toast (Positioned below main image, floating on right side) */}
      {liveCounter !== undefined && (
        <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-[999] max-w-[280px] sm:max-w-xs transition-all duration-500 animate-in fade-in slide-in-from-right-4">
          <div 
            onClick={() => setIsOpen(true)}
            className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border-2 border-[#FF671F]/40 flex flex-col gap-1.5 cursor-pointer hover:scale-105 transition-all group"
          >
            {/* Top row: Live counter badge */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-black text-slate-800 tracking-tight flex items-center gap-1">
                  <span>🚩</span> <span className="text-[#FF671F] font-black">{liveCounter.toLocaleString('en-IN')}+</span> {t.devoteesBooked}
                </span>
              </div>
              <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">
                LIVE
              </span>
            </div>

            {/* Bottom row: Rotating Devotee Booking Toast with smooth transition */}
            {rotatingDevotees.length > 0 && rotatingDevotees[activeBookingIdx % rotatingDevotees.length] && (
              <div className={`flex items-center gap-2 pt-1 border-t border-slate-100 text-xs transition-opacity duration-300 ${isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <span className="text-base flex-shrink-0 animate-bounce">🪔</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-700 truncate">
                    <span className="font-black text-slate-900">
                      {rotatingDevotees[activeBookingIdx % rotatingDevotees.length].name}
                    </span>
                    {rotatingDevotees[activeBookingIdx % rotatingDevotees.length].city 
                      ? ` (${rotatingDevotees[activeBookingIdx % rotatingDevotees.length].city})` 
                      : ''}
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                    <span>✓</span> {t.justBooked || 'ने अभी सेवा बुक की!'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Permanent, Beautiful Sticky Footer "Book Now" Button */}
      <div 
        suppressHydrationWarning
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-[99] shadow-2xl max-w-4xl mx-auto rounded-t-2xl"
      >
        <div className="flex flex-col items-center sm:items-start">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#FF671F]">₹{basePrice.toFixed(0)}</span>
            {parseFloat(offerLink.salePrice) > basePrice && (
              <span className="text-slate-400 line-through text-sm">₹{parseFloat(offerLink.salePrice).toFixed(0)}</span>
            )}
          </div>
        </div>

        {offerLink.supportPhone && (
          <div className="text-center bg-[#FF671F]/10 border border-[#FF671F]/20 px-4 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-700 mr-1.5">
              {t.supportContact}
            </span>
            <a 
              href={`tel:${offerLink.supportPhone}`} 
              className="text-[#FF671F] font-black text-sm hover:underline inline-flex items-center gap-1"
            >
              <i className="tabler-phone text-xs" /> {offerLink.supportPhone}
            </a>
          </div>
        )}
        
        <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end flex-shrink-0">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto px-16 py-3 bg-[#FF671F] hover:bg-[#e05615] active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all text-center flex items-center justify-center gap-2"
          >
            <i className="tabler-booking" /> {t.bookNow}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-t-4 border-emerald-500">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="tabler-circle-check text-emerald-600 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{t.successTitle}</h3>
            <p className="text-sm text-slate-600 mt-2">{t.successDesc}</p>
            {confirmedOrderId && (
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                  {t.orderIdLabel}
                </span>
                <span className="text-sm font-mono text-[#000080] font-bold block select-all">
                  {confirmedOrderId}
                </span>
              </div>
            )}
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Devotee Input Form Modal with beautiful styling */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">{t.devoteeDetails}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{offerLink.title}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <i className="tabler-x text-xl" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              )}

              {devotees.map((devotee, index) => (
                <div key={index} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 relative space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#FF671F] flex items-center gap-1.5">
                      <i className="tabler-user" /> {t.person} #{index + 1} {index === 0 && `(${t.primaryContact})`}
                    </span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removePerson(index)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100/60 px-2.5 py-1 rounded-lg transition-all"
                      >
                        <i className="tabler-trash text-sm" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.name}</label>
                      <input
                        type="text"
                        required
                        value={devotee.name}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                        placeholder="e.g. राहुल शर्मा / Rahul Sharma"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.gotra}</label>
                      <input
                        type="text"
                        value={devotee.gotra}
                        onChange={(e) => handleFieldChange(index, 'gotra', e.target.value)}
                        placeholder="e.g. कश्यप / Kashyap"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.dob}</label>
                      <input
                        type="date"
                        value={devotee.dob}
                        onChange={(e) => handleFieldChange(index, 'dob', e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white transition-all shadow-sm"
                      />
                    </div>

                    {index === 0 ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.phone}</label>
                        <input
                          type="tel"
                          required
                          value={devotee.phone}
                          onChange={(e) => handleFieldChange(index, 'phone', e.target.value)}
                          placeholder="e.g. +91 9999999999"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white transition-all shadow-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.phone}</label>
                        <input
                          type="tel"
                          value={devotee.phone}
                          onChange={(e) => handleFieldChange(index, 'phone', e.target.value)}
                          placeholder={t.sameAsPrimary}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white transition-all shadow-sm"
                        />
                      </div>
                    )}

                    {index === 0 && (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.email}</label>
                          <input
                            type="email"
                            value={devotee.email}
                            onChange={(e) => handleFieldChange(index, 'email', e.target.value)}
                            placeholder="e.g. name@example.com"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white transition-all shadow-sm"
                          />
                        </div>

                        {/* Address & Pincode Auto-lookup Section */}
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-orange-50/40 p-3.5 rounded-xl border border-orange-100/80">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>📮 {t.pincode || 'पिनकोड'}</span>
                              {pincodeLoading && <span className="text-[10px] text-[#FF671F] font-bold animate-pulse">खोज रहे हैं...</span>}
                              {pincodeError && <span className="text-[10px] text-red-500 font-bold">अमान्य पिनकोड</span>}
                              {!pincodeLoading && !pincodeError && devotee.pincode && devotee.pincode.length === 6 && (
                                <span className="text-[10px] text-emerald-600 font-bold">✓ मान्य</span>
                              )}
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={devotee.pincode || ''}
                              onChange={(e) => handlePincodeChange(index, e.target.value)}
                              placeholder="e.g. 395007"
                              className={`w-full px-3 py-2 border rounded-lg text-slate-700 text-sm font-mono focus:outline-none bg-white shadow-sm transition-all ${
                                pincodeError ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-slate-200 focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F]'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>🏘️ {t.locality || 'इलाका / क्षेत्र'}</span>
                              {!Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError) && (
                                <span className='text-[10px] text-slate-400 font-medium'>🔒 लॉक</span>
                              )}
                            </label>
                            <input
                              type="text"
                              disabled={!Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError)}
                              value={devotee.locality || ''}
                              onChange={(e) => handleFieldChange(index, 'locality', e.target.value)}
                              placeholder={Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError) ? "e.g. Ring Road" : "पिनकोड से स्वतः भरेगा"}
                              className={`w-full px-3 py-2 border rounded-lg text-sm transition-all ${
                                Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError)
                                  ? 'border-slate-200 text-slate-700 focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white shadow-sm'
                                  : 'border-slate-200/80 text-slate-400 bg-slate-100/80 cursor-not-allowed select-none'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>🏙️ {t.city || 'शहर / राज्य'}</span>
                              {!Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError) && (
                                <span className='text-[10px] text-slate-400 font-medium'>🔒 लॉक</span>
                              )}
                            </label>
                            <input
                              type="text"
                              disabled={!Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError)}
                              value={devotee.city ? (devotee.state ? `${devotee.city}, ${devotee.state}` : devotee.city) : (devotee.state || '')}
                              onChange={(e) => {
                                const parts = e.target.value.split(',')
                                const updated = [...devotees]
                                updated[index].city = parts[0]?.trim() || ''
                                if (parts[1]) updated[index].state = parts[1].trim()
                                setDevotees(updated)
                              }}
                              placeholder={Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError) ? "e.g. Surat, Gujarat" : "पिनकोड से स्वतः भरेगा"}
                              className={`w-full px-3 py-2 border rounded-lg text-sm transition-all ${
                                Boolean(devotee.pincode && devotee.pincode.length === 6 && !pincodeError)
                                  ? 'border-slate-200 text-slate-700 focus:outline-none focus:border-[#FF671F] focus:ring-1 focus:ring-[#FF671F] bg-white shadow-sm'
                                  : 'border-slate-200/80 text-slate-400 bg-slate-100/80 cursor-not-allowed select-none'
                              }`}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPerson}
                className="w-full py-3.5 border border-dashed border-[#FF671F] hover:bg-orange-500/5 text-[#FF671F] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <i className="tabler-plus" /> {t.addPerson} (+ ₹{offerLink.offerPrice})
              </button>

              {/* Price Breakdown */}
              <div className="p-5 bg-[#FF671F]/5 rounded-2xl border border-[#FF671F]/10 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t.price} ({personCount} {t.person}):</span>
                  <span className="font-semibold text-slate-800">₹{rawTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-800 border-t border-dashed border-[#FF671F]/20 pt-3">
                  <span>{t.total}:</span>
                  <span className="text-[#FF671F] text-lg">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Referral Info */}
              {referralCode && (
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-1.5">
                  <i className="tabler-discount-check text-base" /> Referred By - <strong>{partnerName || referralCode}</strong>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 flex-shrink-0 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#FF671F] hover:bg-[#e05615] disabled:bg-orange-300 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-lg shadow-orange-500/20"
                >
                  {loading ? (
                    <>
                      <i className="tabler-loader animate-spin" /> {t.processing}
                    </>
                  ) : (
                    <>{t.payConfirm}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
