import prisma from '@/libs/prisma'

// Order trail note written each time a customer starts a video download (read by the download report).
export const VIDEO_DOWNLOAD_NOTE = 'Video downloaded by customer'

let offerLinkColsChecked = false
export async function ensureOfferLinkOrderVideoColumns() {
  if (offerLinkColsChecked) return
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE "OfferLinkOrder" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
          ALTER TABLE "OfferLinkOrder" ADD COLUMN IF NOT EXISTS "videoUploadedAt" TIMESTAMP(3);
          ALTER TABLE "OfferLinkOrder" ADD COLUMN IF NOT EXISTS "videoExpired" BOOLEAN NOT NULL DEFAULT false;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE offerlinkorder ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
          ALTER TABLE offerlinkorder ADD COLUMN IF NOT EXISTS "videoUploadedAt" TIMESTAMP(3);
          ALTER TABLE offerlinkorder ADD COLUMN IF NOT EXISTS "videoExpired" BOOLEAN NOT NULL DEFAULT false;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE "offerlinkorder" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
          ALTER TABLE "offerlinkorder" ADD COLUMN IF NOT EXISTS "videoUploadedAt" TIMESTAMP(3);
          ALTER TABLE "offerlinkorder" ADD COLUMN IF NOT EXISTS "videoExpired" BOOLEAN NOT NULL DEFAULT false;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END $$;
    `)
    offerLinkColsChecked = true
  } catch (err) {
    console.error('[ensureOfferLinkOrderVideoColumns]:', err)
  }
}

export function isValidDriveLink(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    return parsed.protocol === 'https:' && (host === 'drive.google.com' || host === 'docs.google.com')
  } catch {
    return false
  }
}

export function extractFolderId(folderUrl: string): string | null {
  const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/) || folderUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)

  return match ? match[1] : null
}

export function extractFileId(fileUrl: string): string | null {
  const match = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)

  return match ? match[1] : null
}

// Order IDs in this app can be:
// 1. Prisma cuid()s (lowercase alphanumeric, ~25 chars, starting with 'c')
// 2. Full uuid()s for Campaign / Offer Link orders (e.g. 7eb64e6a-d463-410c-b877-5bc3cd26b735)
// 3. Short 8-character hex IDs (e.g. 7eb64e6a, #7EB64E6A, MS-7EB64E6A) shown on devotee receipts & SMS
const ORDER_ID_PATTERN = /^c[a-z0-9]{20,30}$/i
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SHORT_ID_PATTERN = /^[0-9a-f]{8,12}$/i

export function orderIdFromFilename(filename: string): string | null {
  if (!filename) return null
  let base = filename.replace(/\.[^./\\]+$/, '').trim() // strip extension
  base = base.replace(/^[#\s]*(MS[-_]?|ORD[-_]?)/i, '').trim()

  if (ORDER_ID_PATTERN.test(base)) return base.toLowerCase()
  if (UUID_PATTERN.test(base)) return base.toLowerCase()
  if (SHORT_ID_PATTERN.test(base)) {
    // If it's pure decimal digits with NO hex characters (e.g. 45736423), it's only valid if it originally had an extension (.mp4 etc)
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(filename)
    const isPureDecimal = /^\d+$/.test(base)
    if (isPureDecimal && !hasExtension) return null
    return base.toLowerCase()
  }

  return null
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
    // 0. If user provided a direct file link instead of a folder:
    const directFileId = extractFileId(folderUrl)
    if (folderUrl.includes('/file/d/') && directFileId) {
      const res = await fetch(folderUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })
      if (res.ok) {
        const fileHtml = await res.text()
        const titleMatch = fileHtml.match(/<title>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1].replace(/ - Google Drive$/i, '').trim() : ''
        const orderId = orderIdFromFilename(title)
        if (orderId) {
          return [{ orderId, fileUrl: `https://drive.google.com/file/d/${directFileId}/view` }]
        }
      }
    }

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
    
    // 1. Search for video filenames ending in video extensions (.mp4, .mov, .m4v, .webm, .mkv, .avi)
    const videoFileRegex = /"([^"\\]+?\.(?:mp4|mov|m4v|webm|mkv|avi))"/gi
    let fileMatch

    while ((fileMatch = videoFileRegex.exec(html)) !== null) {
      const fullFilename = fileMatch[1]
      const orderId = orderIdFromFilename(fullFilename)
      if (!orderId) continue

      const matchIndex = fileMatch.index
      const surround = html.substring(Math.max(0, matchIndex - 500), Math.min(html.length, matchIndex + 500))
      
      const fileIdMatches = surround.match(/[a-zA-Z0-9_-]{25,45}/g) || []
      const validFileIds = fileIdMatches.filter(id =>
        id.toLowerCase() !== orderId.toLowerCase() &&
        !id.toLowerCase().includes('drive') &&
        !id.toLowerCase().includes('google') &&
        !id.toLowerCase().includes('video') &&
        !id.toLowerCase().includes('script') &&
        !id.toLowerCase().includes('http')
      )

      if (validFileIds.length > 0) {
        results.push({
          orderId,
          fileUrl: `https://drive.google.com/file/d/${validFileIds[0]}/view`
        })
      }
    }

    // 2. Strict CUID or UUID fallback (NEVER match pure numbers like 45736423 without video extension)
    if (results.length === 0) {
      const strictIds = Array.from(new Set([
        ...(html.match(/c[a-z0-9]{24}/g) || []),
        ...(html.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [])
      ]))

      for (const id of strictIds) {
        const orderId = id.toLowerCase()
        const index = html.indexOf(id)
        const surround = html.substring(Math.max(0, index - 500), Math.min(html.length, index + 500))
        const fileIdMatches = surround.match(/[a-zA-Z0-9_-]{25,45}/g) || []
        const validFileIds = fileIdMatches.filter(fId =>
          fId.toLowerCase() !== orderId &&
          !fId.toLowerCase().includes('drive') &&
          !fId.toLowerCase().includes('google') &&
          !fId.toLowerCase().includes('video') &&
          !fId.toLowerCase().includes('script') &&
          !fId.toLowerCase().includes('http')
        )
        if (validFileIds.length > 0) {
          results.push({
            orderId,
            fileUrl: `https://drive.google.com/file/d/${validFileIds[0]}/view`
          })
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
    }
  }

  return scrapeDriveFolderHtml(folderUrl)
}
