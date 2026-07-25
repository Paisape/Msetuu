import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireUser, handleApiError } from '@/libs/api-auth'
import { enforceRateLimit } from '@/libs/rateLimit'

type Params = { params: Promise<{ id: string }> }

const MAX_ADDRESS_LENGTH = 500
const MAX_LABEL_LENGTH = 40

// PATCH /api/addresses/[id] — edit one of the user's own saved addresses, or set it as default
export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireUser()

    const rateLimited = enforceRateLimit(req, 'address-write', { limit: 30, windowMs: 60 * 60 * 1000, identifier: user.id, skipIp: true })

    if (rateLimited) return rateLimited

    const { id } = await params
    const existing = await prisma.address.findUnique({ where: { id } })

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    const body = await req.json()
    const { label, fullAddress, isDefault } = body

    const data: Record<string, unknown> = {}

    if (fullAddress !== undefined) {
      if (typeof fullAddress !== 'string' || !fullAddress.trim()) {
        return NextResponse.json({ error: 'fullAddress cannot be empty.' }, { status: 400 })
      }

      const trimmedAddress = fullAddress.trim()

      if (trimmedAddress.length < 5 || trimmedAddress.length > MAX_ADDRESS_LENGTH) {
        return NextResponse.json({ error: `fullAddress must be between 5 and ${MAX_ADDRESS_LENGTH} characters.` }, { status: 400 })
      }

      data.fullAddress = trimmedAddress
    }

    if (label !== undefined) {
      if (label !== null && (typeof label !== 'string' || label.length > MAX_LABEL_LENGTH)) {
        return NextResponse.json({ error: `label must be a string of at most ${MAX_LABEL_LENGTH} characters.` }, { status: 400 })
      }

      data.label = typeof label === 'string' && label.trim() ? label.trim() : null
    }

    // A user may only ever turn isDefault ON here — turning the current default OFF with
    // nothing else selected would leave the address book with no default at all, which the
    // checkout picker isn't designed to handle. To unset a default, the user sets a different
    // address as the new default instead.
    const wantsDefault = isDefault !== undefined && Boolean(isDefault)

    const address = await prisma.$transaction(async (tx: any) => {
      if (wantsDefault && !existing.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } })
        data.isDefault = true
      }

      return tx.address.update({ where: { id }, data })
    })

    return NextResponse.json(address)
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/addresses/[id] — remove one of the user's own saved addresses
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireUser()

    const { id } = await params
    const existing = await prisma.address.findUnique({ where: { id } })

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.address.delete({ where: { id } })

      // If the deleted address was the default and other saved addresses remain, promote the
      // most recently used one so the checkout picker always has a default when possible.
      if (existing.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })

        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } })
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
