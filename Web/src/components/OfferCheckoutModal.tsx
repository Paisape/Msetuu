'use client'

import { useState, useEffect } from 'react'

type Devotee = {
  name: string
  gotra: string
  dob: string
  phone: string
  email: string
}

type Props = {
  offerLink: {
    id: string
    title: string
    offerPrice: string
    salePrice: string
    gstIncluded: boolean
    gstRate: string
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
    orderIdLabel: 'Order ID'
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
    orderIdLabel: 'ऑर्डर आईडी'
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
    orderIdLabel: 'ऑर्डर आयडी'
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
    orderIdLabel: 'ઓર્ડર આઈડી'
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

  const handleFieldChange = (index: number, field: keyof Devotee, value: string) => {
    const updated = [...devotees]
    updated[index][field] = value
    setDevotees(updated)
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
      {/* 1. Permanent, Beautiful Sticky Footer "Book Now" Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-[99] shadow-2xl max-w-4xl mx-auto rounded-t-2xl">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#FF671F]">₹{basePrice.toFixed(0)}</span>
          {parseFloat(offerLink.salePrice) > basePrice && (
            <span className="text-slate-400 line-through text-sm">₹{parseFloat(offerLink.salePrice).toFixed(0)}</span>
          )}
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end flex-grow">
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
