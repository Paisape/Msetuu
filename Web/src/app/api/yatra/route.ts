import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { getRequestInfo } from '@/libs/request-info'
import { logOrderTrail } from '@/libs/orderTrail'
import { sendEmail } from '@/libs/email'
import { yatraBookingConfirmationEmail } from '@/libs/emailTemplates'

// GET /api/yatra — logged-in user's own bookings, or ?all=1 for admins to see every booking
export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const wantsAll = new URL(req.url).searchParams.get('all') === '1'

    const bookings = await prisma.yatraBooking.findMany({
      where: wantsAll && user.role === 'ADMIN' ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bookings)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/yatra — logged-in user submits a Yatra booking form
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const contentType = req.headers.get('content-type') || ''
    let name, contactNumber, cityOfDeparture, destination, totalTravelers, travelDate, comment
    let imageFiles: File[] = []

    if (contentType.includes('application/json')) {
      const body = await req.json()
      name = body.name
      contactNumber = body.contactNumber
      cityOfDeparture = body.cityOfDeparture
      destination = body.destination || body.yatraDestination
      totalTravelers = body.totalTravelers
      travelDate = body.travelDate
      comment = body.comment
    } else {
      const formData = await req.formData()
      name = formData.get('name') as string
      contactNumber = formData.get('contactNumber') as string
      cityOfDeparture = formData.get('cityOfDeparture') as string
      destination = formData.get('destination') as string
      totalTravelers = formData.get('totalTravelers') as string
      travelDate = formData.get('travelDate') as string
      comment = formData.get('comment') as string
      imageFiles = formData.getAll('images') as File[]
    }

    if (!name || !contactNumber || !cityOfDeparture || !destination || !travelDate) {
      return NextResponse.json(
        { error: 'name, contactNumber, cityOfDeparture, destination and travelDate are required.' },
        { status: 400 }
      )
    }

    const parsedTravelers = totalTravelers !== undefined ? Number(totalTravelers) : 1

    if (!Number.isInteger(parsedTravelers) || parsedTravelers < 1) {
      return NextResponse.json({ error: 'totalTravelers must be a positive whole number.' }, { status: 400 })
    }

    const parsedDate = new Date(travelDate as string)

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'travelDate must be a valid date.' }, { status: 400 })
    }

    const { ip, userAgent } = getRequestInfo(req)

    const imageUrls: string[] = []

    for (const file of imageFiles) {
      if (file instanceof File && file.size > 0) {
        let buffer = Buffer.from(await file.arrayBuffer())
        const pipeline = sharp(buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        buffer = await pipeline.webp({ quality: 80 }).toBuffer()

        const safeFileName = `${randomUUID()}.webp`
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })
        await writeFile(path.join(uploadsDir, safeFileName), buffer)
        imageUrls.push(`/uploads/${safeFileName}`)
      }
    }

    const booking = await prisma.yatraBooking.create({
      data: {
        userId: user.id,
        name,
        contactNumber,
        cityOfDeparture,
        yatraDestination: destination,
        totalTravelers: parsedTravelers,
        travelDate: parsedDate,
        comment,
        images: imageUrls,
        status: 'PENDING',
        ipAddress: ip,
        userAgent
      }
    })

    await logOrderTrail({ orderType: 'YATRA', orderId: booking.id, status: 'PENDING', note: 'Yatra booking submitted', actorId: user.id, actorRole: 'USER', req })

    if (user.email) {
      const { subject, html } = yatraBookingConfirmationEmail({
        customerName: name,
        destination,
        travelDate: parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        totalTravelers: parsedTravelers,
        bookingId: booking.id
      })

      await sendEmail({ to: user.email, subject, html })
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
