'use client'

import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

export default function PrivacyPolicyPage() {
  return (
    <Box className='galaxy-bg stars-overlay min-h-screen py-16 text-slate-200'>
      <Container maxWidth='md'>
        <Card className='galaxy-card p-6 md:p-12 border border-emerald-500/20 rounded-2xl shadow-xl'>
          <CardContent>
            <Typography variant='h3' className='font-bold galaxy-glow-text mb-2 text-center' style={{ color: '#006241' }}>
              Privacy Policy
            </Typography>
            <Typography variant='subtitle1' className='text-slate-400 text-center mb-8'>
              Last Updated: July 20, 2026
            </Typography>

            <Divider className='border-slate-800 my-6' />

            <Typography variant='body1' className='mb-6 leading-relaxed'>
              Welcome to <strong>Mandirsetuu</strong>. We value your devotion and trust. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and consulting services (collectively, the &quot;Services&quot;).
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              1. Information We Collect
            </Typography>
            <Typography variant='body1' className='mb-4 leading-relaxed'>
              To provide customized spiritual, astrological, and e-puja services, we collect:
            </Typography>
            <ul className='list-disc pl-6 mb-6 flex flex-col gap-2 text-slate-300'>
              <li><strong>Personal Identifiers:</strong> Name, email address, telephone number, mailing address, and profile photo.</li>
              <li><strong>Spiritual & Astrological Telemetry:</strong> Date of birth, time of birth, place of birth, gender, zodiac sign, and gotra for chanting (sankalp).</li>
              <li><strong>Transaction Data:</strong> Razorpay payment details, billing address, and transaction logs.</li>
              <li><strong>Consultation Recording:</strong> Written logs of astrologer consultation requests and user queries.</li>
            </ul>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              2. How We Use Your Information
            </Typography>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              Your telemetry is processed to:
            </Typography>
            <ul className='list-disc pl-6 mb-6 flex flex-col gap-2 text-slate-300'>
              <li>Construct precise birth charts (Janam Kundli) and dasha calculations.</li>
              <li>Deliver your names and gotra details to verified pandits for holy Sankalp chants at chosen temples.</li>
              <li>Facilitate direct consultations with certified Vedic astrologers.</li>
              <li>Improve app performance, security, and logging admin/user activity telemetry to prevent fraud.</li>
            </ul>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              3. Confidentiality and Security
            </Typography>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              We follow industry-standard security measures (SSL encryption, secure database adapters) to protect your sensitive birth details and payment transactions. Astro-consultations remain strictly confidential between the devotee and the assigned astrologer.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              4. Contact Us
            </Typography>
            <Typography variant='body1' className='leading-relaxed'>
              If you have any questions about this Privacy Policy, please contact us at <a href='mailto:admin@mandirsetuu.com' className='text-emerald-400 underline'>admin@mandirsetuu.com</a>.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
