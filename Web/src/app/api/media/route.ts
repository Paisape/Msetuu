import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import sharp from 'sharp'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100MB limit for video/image assets

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'])
const AUDIO_MIMES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'])

let tableVerified = false

async function ensureMediaAssetTableExists() {
  if (tableVerified) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MediaAsset" (
        "id" TEXT PRIMARY KEY,
        "fileName" TEXT NOT NULL,
        "fileUrl" TEXT UNIQUE NOT NULL,
        "fileType" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MediaAsset_fileType_idx" ON "MediaAsset"("fileType");`).catch(() => {})
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");`).catch(() => {})

    tableVerified = true
  } catch (err) {
    console.error('[MediaAsset DB Init Error]:', err)
  }
}

function getFileType(mime: string): string {
  if (IMAGE_MIMES.has(mime)) return 'IMAGE'
  if (VIDEO_MIMES.has(mime)) return 'VIDEO'
  if (AUDIO_MIMES.has(mime)) return 'AUDIO'
  return 'DOCUMENT'
}

function guessExtension(mime: string, originalName: string): string {
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'application/pdf': '.pdf'
  }
  if (extMap[mime]) return extMap[mime]
  const ext = path.extname(originalName)
  return ext || '.bin'
}

// GET /api/media — List all media assets
export async function GET(req: Request) {
  try {
    await requireAdmin()
    await ensureMediaAssetTableExists()

    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get('type')
    const searchQuery = searchParams.get('search')

    const where: any = {}
    if (typeFilter && typeFilter !== 'ALL') {
      where.fileType = typeFilter.toUpperCase()
    }
    if (searchQuery) {
      where.fileName = { contains: searchQuery, mode: 'insensitive' }
    }

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(assets)
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/media — Upload new media asset (Image or Video)
export async function POST(req: Request) {
  try {
    await requireAdmin()
    await ensureMediaAssetTableExists()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds maximum 100MB limit.' }, { status: 400 })
    }

    const mimeType = file.type || 'application/octet-stream'
    const fileType = getFileType(mimeType)
    const originalName = file.name || 'uploaded-file'
    let buffer = Buffer.from(await file.arrayBuffer())

    let extension = guessExtension(mimeType, originalName)

    // Process images with sharp (convert to optimized WebP, preserving aspect ratio up to 2560px, NO watermark)
    if (IMAGE_MIMES.has(mimeType) && mimeType !== 'image/svg+xml' && mimeType !== 'image/gif') {
      try {
        const pipeline = sharp(buffer).resize(2560, 2560, {
          fit: 'inside',
          withoutEnlargement: true
        })
        buffer = await pipeline.webp({ quality: 85 }).toBuffer()
        extension = '.webp'
      } catch (sharpErr) {
        console.warn('[Sharp optimization skipped]:', sharpErr)
      }
    }

    const safeFileName = `${randomUUID()}${extension}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, safeFileName), buffer)

    const fileUrl = `/uploads/${safeFileName}`

    const asset = await prisma.mediaAsset.create({
      data: {
        fileName: originalName,
        fileUrl,
        fileType,
        mimeType: extension === '.webp' ? 'image/webp' : mimeType,
        fileSize: buffer.length
      }
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
