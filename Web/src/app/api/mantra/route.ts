import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// GET /api/mantra — public list of mantras
export async function GET() {
  try {
    const mantras = await prisma.mantra.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(mantras)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/mantra — admin create mantra
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { title, subtitle, fileUrl, duration, deity } = body

    if (!title || !subtitle || !fileUrl || !duration || !deity) {
      return NextResponse.json({ error: 'All fields (title, subtitle, fileUrl, duration, deity) are required.' }, { status: 400 })
    }

    const mantra = await prisma.mantra.create({
      data: {
        title,
        subtitle,
        fileUrl,
        duration,
        deity
      }
    })

    return NextResponse.json(mantra, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
