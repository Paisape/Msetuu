'use client'

import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

export default function RefundPolicyPage() {
  return (
    <Box className='galaxy-bg stars-overlay min-h-screen py-16 text-slate-200'>
      <Container maxWidth='md'>
        <Card className='galaxy-card p-6 md:p-12 border border-emerald-500/20 rounded-2xl shadow-xl'>
          <CardContent>
            <Typography variant='h3' className='font-bold galaxy-glow-text mb-2 text-center' style={{ color: '#006241' }}>
              Refund Policy
            </Typography>
            <Typography variant='subtitle1' className='text-slate-400 text-center mb-8'>
              Last Updated: July 20, 2026
            </Typography>

            <Divider className='border-slate-800 my-6' />

            <Typography variant='body1' className='mb-6 leading-relaxed'>
              At <strong>Mandirsetuu</strong>, we strive to ensure the highest quality of spiritual and astrological guidance. This Refund Policy outlines the terms under which refunds are processed for our services and bookings.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              1. Astrological Consultations (Jyotish)
            </Typography>
            <Typography variant='body1' className='mb-4 leading-relaxed'>
              We aim to connect you with premier Vedic experts. Refunds for astrologer sessions are granted only under the following conditions:
            </Typography>
            <ul className='list-disc pl-6 mb-6 flex flex-col gap-2 text-slate-300'>
              <li><strong>Technical Drop:</strong> The consultation could not take place due to connection failure or technical error on our platform.</li>
              <li><strong>Astrologer Absence:</strong> The assigned astrologer failed to join the scheduled consultation slot.</li>
            </ul>
            <Typography variant='body2' className='text-amber-400 mb-6 italic'>
              Note: Refund requests based on subjective feedback, differing predictions, or user dissatisfaction with the spiritual guidance are not eligible for refunds.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              2. Holy Offerings (Chadhava & E-Puja)
            </Typography>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              Once your details (name, gotra, birth details) have been shared with the temple authorities or Pandit ji for Sankalp chanting, <strong>no refunds can be issued</strong>. These services are customized and performed on your behalf at designated physical shrines, and materials/logistics are pre-allocated.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              3. Refund Processing
            </Typography>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              Approved refunds will be processed automatically to your original payment method (via Razorpay) within <strong>5 to 7 business days</strong>.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              4. Contact Support
            </Typography>
            <Typography variant='body1' className='leading-relaxed'>
              To request a refund, please email us with your Order ID and transaction receipt at <a href='mailto:refunds@mandirsetuu.com' className='text-emerald-400 underline'>refunds@mandirsetuu.com</a> within 24 hours of the service time.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
