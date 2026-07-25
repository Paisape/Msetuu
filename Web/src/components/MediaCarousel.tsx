'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export type MediaGalleryItem = { url: string; type: 'image' | 'video' }

type Props = {
  media?: MediaGalleryItem[] | null
  title?: string
  onItemClick?: (item: MediaGalleryItem) => void
}

// Auto-scrolling horizontal gallery of extra images/videos for a listing/product detail page,
// shown in addition to the single hero image. Renders nothing when there are fewer than 2 items
// (a single item isn't worth an animated strip — the hero image already covers that case).
// Scroll animation + pause-on-hover are defined once in globals.css (.media-carousel-track) to
// avoid re-declaring keyframes per instance.
const MediaCarousel = ({ media, title = 'Gallery', onItemClick }: Props) => {
  const items = Array.isArray(media) ? media.filter(m => m && m.url) : []

  if (items.length < 2) return null

  // Duplicate the list so the CSS animation (translateX 0 -> -50%) loops seamlessly.
  const loopItems = [...items, ...items]

  return (
    <Box className='mb-6'>
      <Typography variant='subtitle2' className='font-bold mb-2' style={{ color: '#006241' }}>
        {title}
      </Typography>
      <Box
        sx={{
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid rgba(16,185,129,0.15)',
          background: 'rgba(16,185,129,0.04)'
        }}
      >
        <Box className='media-carousel-track' sx={{ display: 'flex', gap: '12px', width: 'max-content', p: '10px' }}>
          {loopItems.map((item, i) => (
            <Box
              key={`${item.url}-${i}`}
              onClick={() => onItemClick?.(item)}
              sx={{
                flex: '0 0 auto',
                width: { xs: 140, sm: 200 },
                height: { xs: 140, sm: 200 },
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(16,185,129,0.2)',
                cursor: onItemClick ? 'pointer' : 'default',
                transition: 'transform 0.2s',
                '&:hover': onItemClick ? { transform: 'scale(1.05)' } : {}
              }}
            >
              {item.type === 'video' ? (
                <video src={item.url} className='w-full h-full object-cover' muted loop playsInline autoPlay />
              ) : (
                <img src={item.url} alt='' className='w-full h-full object-cover' loading='lazy' />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default MediaCarousel
