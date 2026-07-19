import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'

import sharp from 'sharp'

import { requireUser, handleApiError } from '@/libs/api-auth'

// Customer-facing media upload for review images/videos (any logged-in user, not admin-only —
// distinct from /api/upload which is admin-only for catalog/CMS assets). Files are written under
// their own /public/uploads/reviews subfolder for easy moderation cleanup, and the allowed types
// + size limits are intentionally tighter than the admin uploader since this is customer-supplied
// content with no editorial review before it lands on disk.

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB
const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024 // 30MB

export async function POST(req: Request) {
  try {
    await requireUser()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const isImage = IMAGE_MIME_TYPES.has(file.type)
    const isVideo = VIDEO_MIME_TYPES.has(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only image (JPEG/PNG/WebP/GIF) or video (MP4/WebM/MOV) files are allowed.' }, { status: 400 })
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image exceeds the 15MB limit.' }, { status: 400 })
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json({ error: 'Video exceeds the 30MB limit.' }, { status: 400 })
    }

    let buffer = Buffer.from(await file.arrayBuffer())
    let extension = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, '') || guessExtension(file.type)

    if (isImage) {
      buffer = await sharp(buffer)
        .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
      extension = '.webp'
    }

    const safeFileName = `${randomUUID()}${extension}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'reviews')

    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, safeFileName), buffer)

    return NextResponse.json({ url: `/uploads/reviews/${safeFileName}`, type: isImage ? 'image' : 'video' }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

function guessExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov'
  }

  return map[mimeType] ?? ''
}
