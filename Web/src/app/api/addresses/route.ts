import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { enforceRateLimit } from '@/libs/rateLimit'

const MAX_ADDRESSES_PER_USER = 20
const MAX_ADDRESS_LENGTH = 500
const MAX_LABEL_LENGTH = 40

// GET /api/addresses — logged-in user's saved address book, default address first
export async function GET() {
  try {
    const user = await requireUser()

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
    })

    return NextResponse.json(addresses)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/addresses — save a new address to the user's address book
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const rateLimited = enforceRateLimit(req, 'address-write', { limit: 30, windowMs: 60 * 60 * 1000, identifier: user.id, skipIp: true })

    if (rateLimited) return rateLimited

    const body = await req.json()
    const { label, fullAddress, isDefault } = body

    if (!fullAddress || typeof fullAddress !== 'string' || !fullAddress.trim()) {
      return NextResponse.json({ error: 'fullAddress is required.' }, { status: 400 })
    }

    const trimmedAddress = fullAddress.trim()

    if (trimmedAddress.length < 5 || trimmedAddress.length > MAX_ADDRESS_LENGTH) {
      return NextResponse.json({ error: `fullAddress must be between 5 and ${MAX_ADDRESS_LENGTH} characters.` }, { status: 400 })
    }

    if (label !== undefined && label !== null && (typeof label !== 'string' || label.length > MAX_LABEL_LENGTH)) {
      return NextResponse.json({ error: `label must be a string of at most ${MAX_LABEL_LENGTH} characters.` }, { status: 400 })
    }

    const existingCount = await prisma.address.count({ where: { userId: user.id } })

    if (existingCount >= MAX_ADDRESSES_PER_USER) {
      return NextResponse.json({ error: `You can save at most ${MAX_ADDRESSES_PER_USER} addresses. Please delete one first.` }, { status: 400 })
    }

    // First address a user saves is always the default, regardless of what was sent — otherwise
    // checkout's "default" picker would have nothing to preselect.
    const makeDefault = existingCount === 0 || Boolean(isDefault)

    const address = await prisma.$transaction(async (tx: any) => {
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } })
      }

      return tx.address.create({
        data: {
          userId: user.id,
          label: typeof label === 'string' && label.trim() ? label.trim() : null,
          fullAddress: trimmedAddress,
          isDefault: makeDefault
        }
      })
    })

    return NextResponse.json(address, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
