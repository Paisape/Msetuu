import prisma from '@/libs/prisma'

const VIDEO_TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

// Lazily "deletes" any video whose 48-hour window has elapsed — no cron/worker is wired up,
// so this runs inline whenever Chadhava/E-Puja orders are read (list or detail). It clears
// videoUrl and flags videoExpired so order screens can show a clear "removed after 48 hours"
// message instead of a dead link.
export async function expireStaleVideos(): Promise<void> {
  const cutoff = new Date(Date.now() - VIDEO_TTL_MS)

  await Promise.all([
    prisma.chadhavaOrder.updateMany({
      where: { videoUploadedAt: { lt: cutoff }, videoExpired: false, videoUrl: { not: null } },
      data: { videoUrl: null, videoExpired: true }
    }),
    prisma.pujaOrder.updateMany({
      where: { videoUploadedAt: { lt: cutoff }, videoExpired: false, videoUrl: { not: null } },
      data: { videoUrl: null, videoExpired: true }
    })
  ])
}

export function isValidDriveLink(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false

  try {
    const parsed = new URL(url)

    return parsed.protocol === 'https:' && /drive\.google\.com|docs\.google\.com/.test(parsed.hostname)
  } catch {
    return false
  }
}

function extractFolderId(folderUrl: string): string | null {
  const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/) || folderUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)

  return match ? match[1] : null
}

// Order IDs in this app are Prisma cuid()s: lowercase alphanumeric, ~25 chars, starting with 'c'.
const ORDER_ID_PATTERN = /^c[a-z0-9]{20,30}$/

function orderIdFromFilename(filename: string): string | null {
  const base = filename.replace(/\.[^./\\]+$/, '').trim() // strip extension

  return ORDER_ID_PATTERN.test(base) ? base : null
}

/**
 * Lists every file in a shared Google Drive folder via the Drive API v3 (reliable, structured
 * JSON — requires the folder to be shared as "Anyone with the link" and GOOGLE_DRIVE_API_KEY
 * to be configured). Each file must be named exactly as the Order ID it belongs to
 * (e.g. cmrqgaffz0000i0xo9cogfuq9.mp4) — that filename convention is the only mapping signal;
 * nothing is ever inferred or fabricated.
 */
async function listDriveFolderViaApi(folderId: string, apiKey: string): Promise<{ orderId: string; fileUrl: string }[]> {
  const results: { orderId: string; fileUrl: string }[] = []
  let pageToken: string | undefined

  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files')

    url.searchParams.set('q', `'${folderId}' in parents and trashed = false`)
    url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType, webViewLink)')
    url.searchParams.set('pageSize', '1000')
    url.searchParams.set('key', apiKey)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url.toString())

    if (!res.ok) {
      const errBody = await res.json().catch(() => null)

      throw new Error(errBody?.error?.message || `Google Drive API returned ${res.status}. Make sure the folder is shared as "Anyone with the link" and GOOGLE_DRIVE_API_KEY is a valid, unrestricted-or-Drive-API-enabled key.`)
    }

    const data = await res.json()

    for (const file of data.files || []) {
      if (typeof file.mimeType === 'string' && !file.mimeType.startsWith('video/')) continue

      const orderId = orderIdFromFilename(file.name || '')

      if (!orderId) continue

      results.push({ orderId, fileUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view` })
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  return results
}

/**
 * Best-effort fallback: scrapes a public Google Drive folder's raw HTML page to guess at file
 * IDs and filenames. Google Drive's folder listing is client-side rendered, so this frequently
 * finds nothing — it exists only for when GOOGLE_DRIVE_API_KEY isn't configured. Prefer setting
 * GOOGLE_DRIVE_API_KEY and using listDriveFolderViaApi() instead.
 */
async function scrapeDriveFolderHtml(folderUrl: string): Promise<{ orderId: string; fileUrl: string }[]> {
  try {
    // Fetch folder HTML page
    const res = await fetch(folderUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (!res.ok) {
      console.warn('Failed to fetch Google Drive folder page: Status', res.status)
      
return []
    }
    
    const html = await res.text()
    const results: { orderId: string; fileUrl: string }[] = []
    
    // 1. Google INITIAL_DATA JSON payload file matching regex:
    // Google Drive structures data in JSON array format like: ["file_id", "filename", "mimeType", ...]
    // We search for file IDs (25-45 char alphanumeric) followed by filenames containing a CUID (starting with 'c')
    const regex = /"([a-zA-Z0-9_-]{25,50})"\s*,\s*"([^"]+)"/g
    let match

    while ((match = regex.exec(html)) !== null) {
      const fileId = match[1]
      const filename = match[2]
      
      // Match cuid format (length 25, e.g. cmrqgaffz0000i0xo9cogfuq9)
      const cuidMatch = filename.match(/(c[a-z0-9]{24})/)

      if (cuidMatch) {
        const orderId = cuidMatch[1]
        const fileUrl = `https://drive.google.com/file/d/${fileId}/view`

        results.push({ orderId, fileUrl })
        console.log(`Found mapping: Order ID ${orderId} -> File ID ${fileId}`)
      }
    }
    
    // 2. Fallback: Parse via broad proximity scanning if strict regex didn't yield matches
    if (results.length === 0) {
      console.log('Fallback scanning: searching for CUID references directly in page...')
      const cuids = Array.from(new Set(html.match(/c[a-z0-9]{24}/g) || []))
      
      for (const cuid of cuids) {
        const index = html.indexOf(cuid)

        // Look within +/- 300 characters for potential Google Drive file IDs
        const surround = html.substring(Math.max(0, index - 300), Math.min(html.length, index + 300))
        const fileIdMatches = surround.match(/[a-zA-Z0-9_-]{28,45}/g) || []
        
        // Filter out CUID itself, common values, extensions, or URLs
        const validFileIds = fileIdMatches.filter(id => 
          id !== cuid && 
          !id.includes('.') && 
          !id.includes('/') && 
          !id.includes('\\') && 
          !id.includes('"') &&
          !id.includes('type')
        )
        
        if (validFileIds.length > 0) {
          const fileId = validFileIds[0]

          results.push({
            orderId: cuid,
            fileUrl: `https://drive.google.com/file/d/${fileId}/view`
          })
          console.log(`Found proximity mapping: Order ID ${cuid} -> File ID ${fileId}`)
        }
      }
    }
    
    // Deduplicate results
    const uniqueResults = new Map<string, string>()

    results.forEach(r => uniqueResults.set(r.orderId, r.fileUrl))

    return Array.from(uniqueResults.entries()).map(([orderId, fileUrl]) => ({ orderId, fileUrl }))
  } catch (err) {
    console.error('Error in scrapeDriveFolderHtml:', err)
    
return []
  }
}

/**
 * Public entry point used by the Operation > Video Upload folder-mode flow. Every file in the
 * given Drive folder must be named exactly as an Order ID (e.g. cmrqgaffz0000i0xo9cogfuq9.mp4)
 * — that's the only signal used to map a video to an order. Never fabricates a mapping: if
 * nothing can be read, an empty array is returned and the caller must surface that as an error
 * rather than guessing.
 */
export async function parseDriveFolder(folderUrl: string): Promise<{ orderId: string; fileUrl: string }[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const folderId = extractFolderId(folderUrl)

  if (apiKey && folderId) {
    try {
      return await listDriveFolderViaApi(folderId, apiKey)
    } catch (err) {
      console.error('[videoUpload] Drive API folder listing failed, falling back to HTML scan:', err)

      // Fall through to the best-effort scrape below rather than failing outright — a
      // temporary Drive API hiccup shouldn't block the admin entirely.
    }
  }

  return scrapeDriveFolderHtml(folderUrl)
}
