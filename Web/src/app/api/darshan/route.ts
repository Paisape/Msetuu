import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/darshan — public list of temples in the Darshan Experience Center (banner + QR + 3D link)
export async function GET() {
  try {
    const temples = await prisma.darshanTemple.findMany({ orderBy: { createdAt: 'desc' } })

    return NextResponse.json(temples)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/darshan — admin adds a temple (banner image, QR code linking to the 3D Darshan experience)
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { name, location, description, image, qrCodeUrl, model3dUrl } = body

    if (!name || !image || !qrCodeUrl || !model3dUrl) {
      return NextResponse.json({ error: 'name, image, qrCodeUrl and model3dUrl are required.' }, { status: 400 })
    }

    const temple = await prisma.darshanTemple.create({
      data: { name, location: location || null, description: description || null, image, qrCodeUrl, model3dUrl }
    })

    return NextResponse.json(temple, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
