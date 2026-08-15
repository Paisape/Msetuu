import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { createRazorpayOrder, isRazorpayConfigured, getRazorpayKeyId } from '@/libs/razorpay'
import { handleApiError } from '@/libs/api-auth'

// Free Translation/Transliteration helper calling Google Translate API to convert localized text to English
async function translateToEnglish(text: string): Promise<string> {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`)
    if (!res.ok) return text
    const data = await res.json()
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0]
    }
    return text
  } catch {
    return text
  }
}

// POST /api/offers/checkout - Create a pending order and initiate Razorpay checkout
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { offerLinkId, devotees, referralCode } = body

    if (!offerLinkId || !Array.isArray(devotees) || devotees.length === 0) {
      return NextResponse.json({ error: 'Missing required checkout information.' }, { status: 400 })
    }

    // Verify offer link exists and is active
    const offer = await prisma.offerLink.findUnique({
      where: { id: offerLinkId }
    })

    if (!offer || !offer.isActive) {
      return NextResponse.json({ error: 'This offer is no longer available.' }, { status: 400 })
    }

    // Validate devotees details
    for (const devotee of devotees) {
      if (!devotee.name || devotee.name.trim().length === 0) {
        return NextResponse.json({ error: 'Devotee name is required.' }, { status: 400 })
      }
      if (!devotee.gotra || devotee.gotra.trim().length === 0) {
        return NextResponse.json({ error: 'Devotee Gotra is required.' }, { status: 400 })
      }
      if (!devotee.dob || devotee.dob.trim().length === 0) {
        return NextResponse.json({ error: 'Devotee Date of Birth is required.' }, { status: 400 })
      }
      if (!devotee.phone || devotee.phone.trim().length === 0) {
        return NextResponse.json({ error: 'Primary mobile number is required.' }, { status: 400 })
      }
    }

    // Validate Referral Code if provided
    let activeRefCode: string | null = null
    if (referralCode) {
      const ref = await prisma.referralCode.findUnique({
        where: { code: referralCode.trim().toUpperCase() }
      })
      if (ref && ref.isActive) {
        activeRefCode = ref.code
      }
    }

    // Calculate final payment amounts
    const basePrice = Number(offer.offerPrice)
    const personCount = devotees.length
    const rawTotal = basePrice * personCount
    const gstRate = Number(offer.gstRate)

    let finalAmount = 0
    let gstAmount = 0

    if (offer.gstIncluded) {
      // GST is already inside the offerPrice
      finalAmount = rawTotal
      gstAmount = rawTotal - (rawTotal / (1 + gstRate / 100))
    } else {
      // GST needs to be added on top of the offerPrice
      gstAmount = rawTotal * (gstRate / 100)
      finalAmount = rawTotal + gstAmount
    }

    // Ensure Razorpay PG is configured
    if (!(await isRazorpayConfigured())) {
      return NextResponse.json({ error: 'Payment gateway is not currently configured. Please contact support.' }, { status: 500 })
    }

    // Create Razorpay Order Session
    const razorpayKeyId = await getRazorpayKeyId()
    const rzpOrderId = await createRazorpayOrder(finalAmount, `offer_receipt_${Date.now()}`)

    // Translate devotee names and gotras to English for standard reporting
    const formattedDevotees = await Promise.all(
      devotees.map(async (devotee, index) => {
        const nameInput = devotee.name.trim()
        const translatedName = await translateToEnglish(nameInput)
        const translatedGotra = await translateToEnglish(devotee.gotra.trim())
        
        return {
          name: translatedName.trim(),
          nameLocal: nameInput !== translatedName ? nameInput : null,
          gotra: translatedGotra.trim(),
          dob: devotee.dob.trim(),
          phone: devotee.phone.trim(),
          email: devotee.email ? devotee.email.trim() : null,
          isPrimary: index === 0
        }
      })
    )

    // Create the database pending order
    const order = await prisma.offerLinkOrder.create({
      data: {
        offerLinkId: offer.id,
        referralCode: activeRefCode,
        amount: finalAmount,
        gstAmount,
        paymentStatus: 'PENDING',
        paymentId: rzpOrderId, // Temporary save Razorpay Order ID here for reference lookup
        devotees: {
          create: formattedDevotees
        }
      },
      include: {
        devotees: true
      }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      razorpayOrder: {
        id: rzpOrderId,
        amount: Math.round(finalAmount * 100),
        currency: 'INR',
        key: razorpayKeyId
      }
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
