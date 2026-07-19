import { NextResponse } from 'next/server'

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

    const body = await req.json()
    const { name, contactNumber, cityOfDeparture, destination, totalTravelers, travelDate, comment } = body

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

    const parsedDate = new Date(travelDate)

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'travelDate must be a valid date.' }, { status: 400 })
    }

    const { ip, userAgent } = getRequestInfo(req)

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
