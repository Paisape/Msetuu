'use client'

import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

export default function ReturnPolicyPage() {
  return (
    <Box className='galaxy-bg stars-overlay min-h-screen py-16 text-slate-200'>
      <Container maxWidth='md'>
        <Card className='galaxy-card p-6 md:p-12 border border-emerald-500/20 rounded-2xl shadow-xl'>
          <CardContent>
            <Typography variant='h3' className='font-bold galaxy-glow-text mb-2 text-center' style={{ color: '#006241' }}>
              Return & Replacement Policy
            </Typography>
            <Typography variant='subtitle1' className='text-slate-400 text-center mb-8'>
              Last Updated: July 20, 2026
            </Typography>

            <Divider className='border-slate-800 my-6' />

            <Typography variant='body1' className='mb-6 leading-relaxed'>
              Thank you for shopping at the <strong>Mandirsetuu</strong> spiritual store. We offer returns and replacements for physical products under specific conditions.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              1. Physical Goods (Gemstones, Rudraksha, Yantras)
            </Typography>
            <Typography variant='body1' className='mb-4 leading-relaxed'>
              You may request a return or replacement for physical items within <strong>7 days</strong> of delivery if:
            </Typography>
            <ul className='list-disc pl-6 mb-6 flex flex-col gap-2 text-slate-300'>
              <li>The item received is physically damaged or defective.</li>
              <li>The item does not match the description or certificates shown on the platform.</li>
            </ul>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              To be eligible for a return, the item must be unused, in its original packaging, and must include all authentic certificates, labels, and tags intact.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              2. Custom & Digital Products
            </Typography>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              - <strong>Janam Kundli PDFs:</strong> Astrological charts compiled manually by Pandit ji are digital goods customized for your birth details. Therefore, they are <strong>strictly non-returnable and non-replaceable</strong>.
              - <strong>Energized/Pran-Pratishtha Items:</strong> Products that undergo customized energetic rituals (Pran Pratishtha puja) specifically in the devotee&apos;s name cannot be returned.
            </Typography>

            <Typography variant='h5' className='font-bold text-emerald-400 mt-8 mb-4'>
              3. How to Initiate a Return
            </Typography>
            <Typography variant='body1' className='mb-6 leading-relaxed'>
              Please capture clear photos of the damaged/defective product along with the package label and email them to <a href='mailto:returns@mandirsetuu.com' className='text-emerald-400 underline'>returns@mandirsetuu.com</a>. Once approved, we will arrange a reverse pickup or provide courier return instructions.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
