'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

import { effectivePrice, hasOfferDiscount, gstLabel, type Priced } from '@/libs/pricing'

type RelatedItem = Priced & { id: string; title: string; image: string }

type RelatedListingsProps = {

  // Endpoint to fetch the full catalog from (e.g. /api/chadhava/listings) — the same list-type
  // endpoint each module's own listing page already uses.
  fetchUrl: string

  // The current item's id, excluded from the results so a listing never "relates" to itself.
  currentId: string

  // Detail-page route prefix, e.g. '/front-pages/chadhava' — each related card links to
  // `${basePath}/${item.id}`.
  basePath: string
  title?: string

  // Normalizes one raw catalog row into the shape this component renders — field names differ
  // per module (title vs name, nested package pricing, etc.), so the caller supplies this.
  mapItem: (raw: any) => RelatedItem
}

// "You may also like" strip shown at the bottom of every module's detail page — reuses the same
// catalog endpoint the listing page already calls, just filtered down to a few other items.
const RelatedListings = ({ fetchUrl, currentId, basePath, title = 'You May Also Like', mapItem }: RelatedListingsProps) => {
  const [items, setItems] = useState<RelatedItem[]>([])

  useEffect(() => {
    let cancelled = false

    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        if (cancelled || !Array.isArray(data)) return

        const mapped = data
          .filter((raw: any) => raw?.id && raw.id !== currentId)
          .map(mapItem)
          .slice(0, 3)

        setItems(mapped)
      })
      .catch(() => {
        // No related items shown on error — not critical to the page.
      })

    return () => {
      cancelled = true
    }
  }, [fetchUrl, currentId])

  if (items.length === 0) return null

  return (
    <Box className='mt-16'>
      <Typography variant='h5' className='font-bold mb-6' style={{ color: '#059669' }}>
        {title}
      </Typography>
      <Grid container spacing={6}>
        {items.map(item => (
          <Grid size={{ xs: 12, sm: 4 }} key={item.id}>
            <Card className='galaxy-card h-full flex flex-col overflow-hidden'>
              <div className='relative h-40 w-full overflow-hidden'>
                <img src={item.image} alt={item.title} className='w-full h-full object-cover' />
              </div>
              <CardContent className='flex flex-col flex-1 p-4'>
                <Typography variant='subtitle1' className='font-bold mb-3 line-clamp-2' style={{ color: '#047857' }}>
                  {item.title}
                </Typography>
                <div className='mt-auto'>
                  <Typography className='font-bold mb-1' style={{ color: '#059669' }}>
                    {hasOfferDiscount(item) && (
                      <span style={{ textDecoration: 'line-through', opacity: 0.55, marginRight: 6, fontSize: '0.85em' }}>
                        ₹{item.price}
                      </span>
                    )}
                    ₹{effectivePrice(item)}
                  </Typography>
                  {gstLabel(item) && (
                    <Typography variant='caption' className='block mb-2' style={{ color: '#6b7280' }}>
                      {gstLabel(item)}
                    </Typography>
                  )}
                  <Button
                    component={Link}
                    href={`${basePath}/${item.id}`}
                    variant='outlined'
                    fullWidth
                    size='small'
                    className='font-semibold mt-2'
                    style={{ borderColor: 'rgba(16,185,129,0.5)', color: '#059669' }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default RelatedListings
