// Shared sanitizer for the ordered image/video gallery field (`media Json?`) used on
// ChadhavaListing, PujaListing, and Product. Array position is the display order — there is no
// separate `order` number stored per item, so re-saving the array in the desired sequence is how
// reordering works from the admin UI.

export type MediaGalleryItem = { url: string; type: 'image' | 'video' }

const MAX_MEDIA_ITEMS = 20
const VALID_TYPES = new Set(['image', 'video'])

// Only accept URLs that point at our own upload endpoint's output (relative /uploads/... paths)
// or absolute http(s) URLs — never javascript:/data: URIs or anything else that could be used to
// smuggle a script into an <img>/<video> src rendered from admin-controlled but still
// externally-influenced data.
const isSafeUrl = (url: string) => /^\/uploads\//.test(url) || /^https?:\/\//i.test(url)

export function sanitizeMediaGallery(input: unknown): MediaGalleryItem[] | null {
  if (!Array.isArray(input)) return null

  const sanitized = input
    .slice(0, MAX_MEDIA_ITEMS)
    .map((item: any) => {
      const url = typeof item?.url === 'string' ? item.url.trim() : ''
      const type = VALID_TYPES.has(item?.type) ? item.type : 'image'

      return url && isSafeUrl(url) ? { url, type } : null
    })
    .filter((item): item is MediaGalleryItem => item !== null)

  return sanitized
}
