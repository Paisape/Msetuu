import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin()

    const { id } = await params
    const asset = await prisma.mediaAsset.findUnique({ where: { id } })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 })
    }

    // Try deleting file from disk
    try {
      const fileName = path.basename(asset.fileUrl)
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName)
      await unlink(filePath)
    } catch (fsErr) {
      console.warn('[Disk file unlink skipped]:', fsErr)
    }

    await prisma.mediaAsset.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Asset deleted successfully.' })
  } catch (err) {
    return handleApiError(err)
  }
}
