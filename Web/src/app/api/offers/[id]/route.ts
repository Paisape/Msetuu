import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'

type Params = {
  params: Promise<{ id: string }>
}

// PUT /api/offers/[id] - Edit an offer link (Admin only)
export async function PUT(req: Request, { params }: Params) {
  try {
    await requireUser()
    const { id } = await params

    const body = await req.json()
    const { slug, title, salePrice, offerPrice, gstIncluded, gstRate, htmlContent, isActive } = body

    const existing = await prisma.offerLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Offer Link not found.' }, { status: 404 })
    }

    const data: Record<string, any> = {}
    if (slug !== undefined) {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      if (cleanSlug !== existing.slug) {
        const duplicate = await prisma.offerLink.findUnique({ where: { slug: cleanSlug } })
        if (duplicate) {
          return NextResponse.json({ error: 'An offer with this slug already exists.' }, { status: 400 })
        }
      }
      data.slug = cleanSlug
    }

    if (title !== undefined) data.title = title.trim()
    if (salePrice !== undefined) data.salePrice = Number(salePrice)
    if (offerPrice !== undefined) data.offerPrice = Number(offerPrice)
    if (gstIncluded !== undefined) data.gstIncluded = Boolean(gstIncluded)
    if (gstRate !== undefined) data.gstRate = Number(gstRate)
    if (htmlContent !== undefined) data.htmlContent = htmlContent
    if (isActive !== undefined) data.isActive = Boolean(isActive)

    const updated = await prisma.offerLink.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, offer: updated })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/offers/[id] - Delete an offer link (Admin only)
export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireUser()
    const { id } = await params

    const existing = await prisma.offerLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Offer Link not found.' }, { status: 404 })
    }

    await prisma.offerLink.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Offer Link deleted.' })
  } catch (err) {
    return handleApiError(err)
  }
}
