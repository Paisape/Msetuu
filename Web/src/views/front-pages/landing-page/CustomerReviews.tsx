// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useKeenSlider } from 'keen-slider/react'
import classnames from 'classnames'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
import AppKeenSlider from '@/libs/styles/AppKeenSlider'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

type DisplayReview = {
  desc: string
  label: string
  rating: number
  name: string
  position: string
  avatarSrc: string
}

// Shown only until real APPROVED reviews exist in the database (empty state before any customer
// has reviewed a completed order) — never mixed with real reviews.
const FALLBACK_REVIEWS: DisplayReview[] = []

const ORDER_TYPE_LABELS: Record<string, string> = {
  CHADHAVA: 'Chadhava Offering',
  EPUJA: 'E-Puja Blessing',
  KUNDLI: 'Kundli Order',
  JYOTISH: 'Jyotish Advice',
  ECOMMERCE: 'Product Review'
}

const CustomerReviews = () => {
  const [data, setData] = useState<DisplayReview[]>(FALLBACK_REVIEWS)

  useEffect(() => {
    fetch('/api/reviews?recent=1&limit=8')
      .then(res => res.json())
      .then((reviews: any[]) => {
        if (Array.isArray(reviews)) {
          const mapped = reviews
            .filter(r => r.comment)
            .map(r => ({
              desc: r.comment,
              label: ORDER_TYPE_LABELS[r.orderType] || r.targetTitle || 'Verified Purchase',
              rating: r.rating,
              name: r.customerName || 'Verified Customer',
              position: 'Verified Purchase',
              avatarSrc: '/images/avatars/1.png'
            }))

          if (mapped.length > 0) setData(mapped)
        }
      })
      .catch(() => {
        // Keep the fallback reviews on error
      })
  }, [])

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: { perView: 3, origin: 'auto' },
      breakpoints: {
        '(max-width: 1200px)': { slides: { perView: 2, spacing: 10, origin: 'auto' } },
        '(max-width: 900px)': { slides: { perView: 2, spacing: 10 } },
        '(max-width: 600px)': { slides: { perView: 1, spacing: 10, origin: 'center' } }
      }
    },
    [
      slider => {
        let timeout: ReturnType<typeof setTimeout>
        const mouseOver = false

        function clearNextTimeout() { clearTimeout(timeout) }

        function nextTimeout() {
          clearTimeout(timeout)
          if (mouseOver) return
          timeout = setTimeout(() => { slider.next() }, 2000)
        }

        slider.on('created', nextTimeout)
        slider.on('dragStarted', clearNextTimeout)
        slider.on('animationEnded', nextTimeout)
        slider.on('updated', nextTimeout)
      }
    ]
  )

  return (
    <section className={classnames('flex flex-col gap-8 plb-[100px]', styles.sectionStartRadius)}
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}>
      <div className={classnames('flex max-md:flex-col max-sm:flex-wrap is-full gap-6', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-1 bs-full justify-center items-center lg:items-start is-full md:is-[30%] mlb-auto sm:pbs-2'>
          <Chip
            label='Real Customer Reviews'
            variant='tonal'
            size='small'
            className='mbe-3'
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#006241', fontWeight: 'bold' }}
          />
          <div className='flex flex-col gap-y-1 flex-wrap max-lg:text-center'>
            <Typography variant='h4' style={{ color: '#006241', fontWeight: 800 }}>
              <span className='relative z-[1] font-extrabold'>
                What people say
                <img
                  src='/images/front-pages/landing-page/bg-shape.png'
                  alt='bg-shape'
                  className='absolute block-end-0 z-[1] bs-[40%] is-[132%] inline-start-[-8%] block-start-[17px]'
                />
              </span>
            </Typography>
            <Typography style={{ color: '#4b5563' }}>
              See what our customers have to say about their experience.
            </Typography>
          </div>
          <div className='flex gap-x-4 mbs-11'>
            <CustomIconButton
              variant='tonal'
              onClick={() => instanceRef.current?.prev()}
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#006241' }}
            >
              <i className='tabler-chevron-left' />
            </CustomIconButton>
            <CustomIconButton
              variant='tonal'
              onClick={() => instanceRef.current?.next()}
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#006241' }}
            >
              <i className='tabler-chevron-right' />
            </CustomIconButton>
          </div>
        </div>

        <div className='is-full md:is-[70%]'>
          <AppKeenSlider>
            <div ref={sliderRef} className='keen-slider mbe-6'>
              {data.map((item, index) => (
                <div key={index} className='keen-slider__slide flex p-4 sm:p-3'>
                  <Card elevation={0} className='flex items-start border border-emerald-100 bg-white rounded-2xl shadow-sm w-full'>
                    <CardContent className='p-8 items-center mlb-auto w-full'>
                      <div className='flex flex-col gap-4 items-start'>
                        <span
                          className='text-sm font-bold px-3 py-1 rounded-full'
                          style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#006241' }}
                        >
                          {item.label}
                        </span>
                        <Typography style={{ color: '#374151' }}>{item.desc}</Typography>
                        <Rating value={item.rating} readOnly sx={{ '& .MuiRating-iconFilled': { color: '#f59e0b' } }} />
                        <div className='flex items-center gap-x-3'>
                          <CustomAvatar size={32} src={item.avatarSrc} alt={item.name} />
                          <div className='flex flex-col items-start'>
                            <Typography className='font-medium' style={{ color: '#0f172a' }}>
                              {item.name}
                            </Typography>
                            <Typography variant='body2' style={{ color: '#6b7280' }}>
                              {item.position}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </AppKeenSlider>
        </div>
      </div>
      <Divider style={{ borderColor: 'rgba(16,185,129,0.15)' }} />
    </section>
  )
}

export default CustomerReviews
