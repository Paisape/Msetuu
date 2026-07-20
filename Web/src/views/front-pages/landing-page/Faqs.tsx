// React Imports
import { useEffect, useRef, useState } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

type FaqsDataTypes = {
  id: string
  question: string
  active?: boolean
  answer: string
}

const FaqsData: FaqsDataTypes[] = [
  {
    id: 'panel1',
    question: 'How do I receive Prasad and blessings after Chadhava?',
    active: true,
    answer:
      'After the Chadhava is offered, we record a personalized video of the Pandit ji chanting your name and gotra. This video is uploaded to your admin panel dashboard. The physical Prasad is packaged hygienically and couriered to your registered address.'
  },
  {
    id: 'panel2',
    question: 'Can I book an E-Puja for my family members?',
    answer:
      'Yes! We offer Single, Couple, and Family packages for all E-Pujas. You can fill in the name, gender, birth date, birth place, and any special gotra/comment for all participating family members during checkout.'
  },
  {
    id: 'panel3',
    question: 'Are the gemstones and items authentic?',
    answer:
      'Absolutely. All gemstones, bracelets, and Rudraksha beads sold on Mandirsetuu are certified by government-recognized gemological laboratories. They are energized by Vedic rituals before shipment and come with a physical certificate.'
  },
  {
    id: 'panel4',
    question: 'How do I connect with my booked Astrologer?',
    answer:
      'Once you book a slot (30 mins or 1 hour) and complete the payment, the consultation booking is shared with the astrologer. You will receive an SMS and Email confirmation. The astrologer will connect with you via call/chat at the scheduled time.'
  }
]

const Faqs = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()

  // Admin-managed FAQs for the home page (Content Management > FAQs, page = "home") replace
  // the built-in defaults below once configured; the defaults keep this section non-empty
  // until then.
  const [faqs, setFaqs] = useState<FaqsDataTypes[]>(FaqsData)

  useEffect(() => {
    fetch('/api/faqs?page=home')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(
            data.map((f: any, idx: number) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              active: idx === 0
            }))
          )
        }
      })
      .catch(() => {
        // Keep the built-in default FaqsData on error
      })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (skipIntersection.current) {
          skipIntersection.current = false

          return
        }

        updateIntersections({ [entry.target.id]: entry.isIntersecting })
      },
      { threshold: 0.35 }
    )

    ref.current && observer.observe(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id='faq' ref={ref} className={classnames('plb-[100px] bg-backgroundDefault', styles.sectionStartRadius)}>
      <div className={classnames('flex flex-col gap-16', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip
            size='small'
            variant='tonal'
            label='FAQ'
            style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#006241', fontWeight: 'bold' }}
          />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography variant='h4' style={{ color: '#006241', fontWeight: 800 }}>
                Frequently asked
                <span className='relative z-[1] font-extrabold'>
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='bg-shape'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[132%] -inline-start-[8%] block-start-[17px]'
                  />{' '}
                  questions
                </span>
              </Typography>
            </div>
            <Typography className='text-center' style={{ color: '#4b5563' }}>
              Browse through these FAQs to find answers to commonly asked questions.
            </Typography>
          </div>
        </div>
        <div>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, lg: 5 }} className='text-center'>
              <img
                src='/images/front-pages/landing-page/boy-sitting-with-laptop.png'
                alt='boy with laptop'
                className='is-[80%] max-is-[320px]'
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <div>
                {faqs.map((data, index) => {
                  return (
                    <Accordion key={index} defaultExpanded={data.active}>
                      <AccordionSummary
                        aria-controls={data.id + '-content'}
                        id={data.id + '-header'}
                        className='font-medium'
                        color='text.primary'
                      >
                        <Typography component='span'>{data.question}</Typography>
                      </AccordionSummary>
                      <AccordionDetails className='text-textSecondary'>{data.answer}</AccordionDetails>
                    </Accordion>
                  )
                })}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </section>
  )
}

export default Faqs
