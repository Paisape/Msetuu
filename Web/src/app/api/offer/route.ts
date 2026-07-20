import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { sendEmail } from '@/libs/email'
import { getSettingOrEnv } from '@/libs/appSettings'

// GET /api/offer — Admin only: lists all offers with visit and order statistics
export async function GET(req: Request) {
  try {
    await requireAdmin()

    const offers = await prisma.offer.findMany({
      include: {
        _count: {
          select: { orders: true, visits: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(offers)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/offer — Admin only: creates a new special offer and optional email/whatsapp broadcast
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { slug, title, subtitle, headerImage, details, pricingType, salePrice, offerPrice, packages, gstPercentage, gstInclusive, active, broadcast } = body

    if (!slug || !title || !headerImage || !details || salePrice === undefined || offerPrice === undefined) {
      return NextResponse.json({ error: 'slug, title, headerImage, details, salePrice, and offerPrice are required.' }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await prisma.offer.findUnique({ where: { slug } })

    if (existing) {
      return NextResponse.json({ error: 'An offer with this slug already exists. Please choose a unique URL slug.' }, { status: 400 })
    }

    const offer = await prisma.offer.create({
      data: {
        slug,
        title,
        subtitle,
        headerImage,
        details,
        pricingType: pricingType || 'FLAT',
        salePrice: Number(salePrice),
        offerPrice: Number(offerPrice),
        packages: packages || null,
        gstPercentage: Number(gstPercentage ?? 18),
        gstInclusive: gstInclusive !== false,
        active: active !== false
      }
    })

    // If active and broadcast is requested, send email + mock whatsapp alerts
    if (offer.active && broadcast) {
      const users = await prisma.user.findMany({
        where: { email: { not: null } },
        select: { email: true, name: true, phone: true }
      })

      const mailHost = await getSettingOrEnv('EMAIL', 'SMTP_HOST', 'SMTP_HOST')
      const mailUser = await getSettingOrEnv('EMAIL', 'SMTP_USER', 'SMTP_USER')
      const isEmailEnabled = !!(mailHost && mailUser)

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

      let originalDisplay = `₹${offer.salePrice}`
      let offerDisplay = `₹${offer.offerPrice}`

      if (offer.pricingType === 'PACKAGE' && offer.packages && Array.isArray(offer.packages) && offer.packages.length > 0) {
        const sorted = [...(offer.packages as any[])].sort((a, b) => a.offerPrice - b.offerPrice)

        offerDisplay = `Starting from ₹${sorted[0].offerPrice}`
        originalDisplay = `₹${sorted[0].salePrice}`
      }

      for (const u of users) {
        // Email Broadcast
        if (isEmailEnabled && u.email) {
          await sendEmail({
            to: u.email,
            subject: `✨ Special Offer: ${offer.title}`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="background-color: #ecfdf5; color: #006241; padding: 6px 12px; border-radius: 9999px; font-size: 13px; font-weight: bold; border: 1px solid #a7f3d0;">Exclusive Promotion</span>
                </div>
                <h2 style="color: #006241; margin-bottom: 8px; text-align: center;">Exclusive Offer for You!</h2>
                <h3 style="color: #0f172a; margin-top: 0; text-align: center; font-size: 20px;">${offer.title}</h3>
                ${offer.subtitle ? `<p style="color: #4b5563; font-style: italic; text-align: center; margin-bottom: 20px;">${offer.subtitle}</p>` : ''}
                <div style="margin: 24px 0; text-align: center;">
                  <img src="${offer.headerImage}" alt="${offer.title}" style="max-width: 100%; border-radius: 12px; max-height: 250px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.08);" />
                </div>
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; border: 1px solid #f1f5f9;">
                  <span style="text-decoration: line-through; color: #94a3b8; font-size: 16px; margin-right: 12px;">${originalDisplay}</span>
                  <span style="color: #006241; font-size: 24px; font-weight: bold;">${offerDisplay}</span>
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px;">*${offer.gstInclusive ? 'GST Inclusive' : '+18% GST'}</div>
                </div>
                <p style="color: #374151; line-height: 1.6; font-size: 15px;">We have created a tailored promotional package for our devotees. Access this offer directly via the button below to reserve yours:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/front-pages/offer/${offer.slug}" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(16,185,129,0.2);">Claim Special Offer</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">You received this email because you are a valued member of the Mandirsetuu community.</p>
              </div>
            `
          })
        }

        // WhatsApp Broadcast (Mocked)
        if (u.phone) {
          console.log(`[WhatsApp Broadcast Mock] Sent to ${u.name} (${u.phone}): "New Exclusive Offer: ${offer.title}. ${offerDisplay}. Link: ${baseUrl}/front-pages/offer/${offer.slug}"`)
        }
      }
    }

    return NextResponse.json(offer, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
