import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// PUT /api/offer/[slug]/edit — Admin only: updates an existing offer
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin()
    const { slug } = await params
    const body = await req.json()
    const { title, subtitle, headerImage, details, pricingType, salePrice, offerPrice, packages, gstPercentage, gstInclusive, active } = body

    const existing = await prisma.offer.findUnique({ where: { slug } })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 })
    }

    const updated = await prisma.offer.update({
      where: { slug },
      data: {
        title: title !== undefined ? title : existing.title,
        subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
        headerImage: headerImage !== undefined ? headerImage : existing.headerImage,
        details: details !== undefined ? details : existing.details,
        pricingType: pricingType !== undefined ? pricingType : existing.pricingType,
        salePrice: salePrice !== undefined ? Number(salePrice) : existing.salePrice,
        offerPrice: offerPrice !== undefined ? Number(offerPrice) : existing.offerPrice,
        packages: packages !== undefined ? packages : existing.packages,
        gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : existing.gstPercentage,
        gstInclusive: gstInclusive !== undefined ? gstInclusive : existing.gstInclusive,
        active: active !== undefined ? active : existing.active
      }
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/offer/[slug]/edit — Admin only: deletes an existing offer
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin()
    const { slug } = await params

    const existing = await prisma.offer.findUnique({ where: { slug } })

    if (!existing) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 })
    }

    await prisma.offer.delete({ where: { slug } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
