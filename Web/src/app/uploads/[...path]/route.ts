import { NextResponse } from 'next/server'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'

// Next.js standalone mode only caches static files that exist at build time.
// Any file uploaded to /public/uploads at runtime will return a 404 from the
// static file router. This dynamic catch-all route intercepts those 404s
// and streams the file directly from disk, instantly fixing broken images.
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params
    
    if (!pathArray || pathArray.length === 0) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const safePath = pathArray.join('/')
    
    // Prevent directory traversal attacks
    if (safePath.includes('..')) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const absolutePath = path.join(process.cwd(), 'public', 'uploads', safePath)

    try {
      const stats = await stat(absolutePath)
      
      if (!stats.isFile()) {
        return new NextResponse('Not Found', { status: 404 })
      }

      // Determine content type based on extension
      const ext = path.extname(absolutePath).toLowerCase()
      let contentType = 'application/octet-stream'
      
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.pdf': 'application/pdf',
        '.mp3': 'audio/mpeg'
      }

      if (mimeTypes[ext]) {
        contentType = mimeTypes[ext]
      }

      // Create a readable stream
      const stream = createReadStream(absolutePath)
      
      // We must cast the Node stream to a Web ReadableStream for NextResponse
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk))
          stream.on('end', () => controller.close())
          stream.on('error', (err) => controller.error(err))
        },
        cancel() {
          stream.destroy()
        }
      })

      return new NextResponse(webStream, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return new NextResponse('Not Found', { status: 404 })
      }
      throw err
    }
  } catch (error) {
    console.error('[Uploads Route Error]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
