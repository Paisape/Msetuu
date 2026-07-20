import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'

import sharp from 'sharp'

import { requireAdmin, handleApiError } from '@/libs/api-auth'

// Admin-only media upload used to attach completion proof (photo/video) to Chadhava & E-Puja
// orders, Kundli scan copies, product/listing images, banners, and Darshan temple assets.
//
// Images are resized + re-compressed to a standard size for their section (so every card in
// a given section — banners, shop-purpose tiles, product cards, etc. — displays uniformly
// regardless of what the admin originally uploaded) and converted to WebP for a much smaller
// file size. Videos and PDFs are stored as-is (only size-limited), since re-encoding those is
// out of scope here.
//
// NOTE: files are stored on local disk under /public/uploads for simplicity. For a real
// production deployment (multiple server instances, ephemeral filesystems), swap the
// `writeFile` call below for an S3 / Cloudinary / GCS upload and return the resulting CDN URL
// instead — the rest of the app only depends on getting back a URL string.

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const ALLOWED_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf', // Kundli scan copies are often scanned as PDF
  'audio/mpeg',
  'audio/mp3'
])

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB, checked against the original upload

// Standard display size per section, so admin uploads always end up a consistent size on the
// storefront no matter what the source image's original dimensions were. `cover` crops to
// exactly fill the target box (used where every card in a grid must look uniform); `inside`
// fits within the box without cropping (used for documents/proof photos where cropping could
// cut off important content).
const TARGET_DIMENSIONS: Record<string, { width: number; height: number; fit: 'cover' | 'inside' }> = {
  banner: { width: 1600, height: 800, fit: 'cover' },
  'shop-purpose': { width: 400, height: 400, fit: 'cover' },
  chadhava: { width: 800, height: 600, fit: 'cover' },
  epuja: { width: 800, height: 600, fit: 'cover' },
  kundli: { width: 800, height: 600, fit: 'cover' },
  product: { width: 800, height: 800, fit: 'cover' },
  astrologer: { width: 500, height: 500, fit: 'cover' },
  darshan: { width: 800, height: 600, fit: 'cover' },
  qr: { width: 600, height: 600, fit: 'inside' },
  proof: { width: 1400, height: 1400, fit: 'inside' },
  scan: { width: 2000, height: 2600, fit: 'inside' },
  default: { width: 1200, height: 1200, fit: 'inside' }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file')
    const uploadType = String(formData.get('type') || 'default')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 50MB limit.' }, { status: 400 })
    }

    const originalSizeBytes = file.size
    let buffer = Buffer.from(await file.arrayBuffer())
    let extension = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, '') || guessExtension(file.type)

    if (IMAGE_MIME_TYPES.has(file.type)) {
      const target = TARGET_DIMENSIONS[uploadType] || TARGET_DIMENSIONS.default

      const pipeline = sharp(buffer).resize(target.width, target.height, {
        fit: target.fit,
        withoutEnlargement: true,
        position: 'centre'
      })

      // QR codes need crisp edges to stay scannable — lossless PNG instead of lossy WebP.
      if (uploadType === 'qr') {
        buffer = await pipeline.png({ quality: 90 }).toBuffer()
        extension = '.png'
      } else {
        buffer = await pipeline.webp({ quality: 80 }).toBuffer()
        extension = '.webp'
      }
    }

    const finalSizeBytes = buffer.length
    const safeFileName = `${randomUUID()}${extension}`

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, safeFileName), buffer)

    return NextResponse.json(
      { url: `/uploads/${safeFileName}`, originalSizeBytes, finalSizeBytes },
      { status: 201 }
    )
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
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3'
  }

  return map[mimeType] ?? ''
}
