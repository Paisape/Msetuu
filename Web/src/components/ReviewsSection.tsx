'use client'

import { useState, useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

type ReviewMediaItem = { url: string; type: 'image' | 'video' }

type ReviewItem = {
  id: string
  customerName: string
  rating: number
  comment: string | null
  media?: ReviewMediaItem[] | null
  createdAt: string
}

type Props = {

  // Matches Review.orderType — CHADHAVA, EPUJA, KUNDLI, JYOTISH, ECOMMERCE
  orderType: string

  // The ChadhavaListing/PujaListing/KundliListing/Astrologer/Product id being reviewed
  targetId: string
}

// Read-only display of a listing's approved customer reviews + average rating. Submission
// happens from My Orders (only there can we already know the review is tied to a verified,
// PAID order), so this component only ever renders what admins have approved.
const ReviewsSection = ({ orderType, targetId }: Props) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reviews?orderType=${encodeURIComponent(orderType)}&targetId=${encodeURIComponent(targetId)}`)
      .then(res => res.json())
      .then(data => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setAverageRating(data.averageRating || 0)
        setCount(data.count || 0)
      })
      .catch(() => {
        // Leave the section empty on error rather than showing stale/incorrect data
      })
      .finally(() => setLoading(false))
  }, [orderType, targetId])

  if (loading) {
    return (
      <Box className='flex justify-center py-8'>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 6 }}>
      <Box className='flex items-center gap-3 mb-4'>
        <Typography variant='h5' className='font-bold' style={{ color: '#059669' }}>
          Customer Reviews
        </Typography>
        {count > 0 && (
          <>
            <Rating value={averageRating} precision={0.1} readOnly size='small' sx={{ '& .MuiRating-iconFilled': { color: '#f59e0b' } }} />
            <Typography variant='body2' style={{ color: '#6b7280' }}>
              {averageRating.toFixed(1)} ({count} review{count > 1 ? 's' : ''})
            </Typography>
          </>
        )}
      </Box>

      {reviews.length === 0 ? (
        <Typography variant='body2' style={{ color: '#6b7280' }}>
          No reviews yet — be the first to share your experience after your order is complete.
        </Typography>
      ) : (
        <div className='flex flex-col gap-4'>
          {reviews.map((r, idx) => (
            <Box key={r.id}>
              <Box className='flex items-center justify-between mb-1'>
                <Typography className='font-semibold' style={{ color: '#374151' }}>
                  {r.customerName}
                </Typography>
                <Typography variant='caption' style={{ color: '#9ca3af' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
              <Rating value={r.rating} readOnly size='small' sx={{ '& .MuiRating-iconFilled': { color: '#f59e0b' } }} />
              {r.comment && (
                <Typography variant='body2' className='mt-1' style={{ color: '#4b5563' }}>
                  {r.comment}
                </Typography>
              )}
              {Array.isArray(r.media) && r.media.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-2'>
                  {r.media.map((item, mediaIdx) =>
                    item.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={mediaIdx}
                        src={item.url}
                        alt=''
                        className='w-20 h-20 object-cover rounded-lg cursor-pointer'
                        style={{ border: '1px solid rgba(16,185,129,0.2)' }}
                        onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                      />
                    ) : (
                      <video
                        key={mediaIdx}
                        src={item.url}
                        controls
                        className='w-32 h-20 object-cover rounded-lg'
                        style={{ border: '1px solid rgba(16,185,129,0.2)' }}
                      />
                    )
                  )}
                </div>
              )}
              {idx < reviews.length - 1 && <Divider sx={{ mt: 3, borderColor: 'rgba(16,185,129,0.1)' }} />}
            </Box>
          ))}
        </div>
      )}
    </Box>
  )
}

export default ReviewsSection
