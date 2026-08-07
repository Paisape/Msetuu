'use client'

import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

export default function ReturnPolicyPage() {
  return (
    <Container maxWidth='md' className='py-16'>
      <Box className='mb-8'>
        <Typography variant='h3' component='h1' className='font-bold mb-4' style={{ color: '#006241' }}>
          Return & Replacement Policy
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          Last Updated: July 20, 2026
        </Typography>
      </Box>

      <Divider className='my-6' />

      <Typography variant='body1' paragraph className='leading-relaxed'>
        Thank you for shopping at the <strong>Mandirsetuu</strong> spiritual store. We offer returns and replacements for physical products under specific conditions.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-4' style={{ color: '#006241' }}>
        1. Physical Goods (Gemstones, Rudraksha, Yantras)
      </Typography>
      <Typography variant='body1' paragraph className='leading-relaxed'>
        You may request a return or replacement for physical items within <strong>7 days</strong> of delivery if:
      </Typography>
      <ul className='list-disc pl-6 mb-6 flex flex-col gap-2'>
        <li>The item received is physically damaged or defective.</li>
        <li>The item does not match the description or certificates shown on the platform.</li>
      </ul>
      <Typography variant='body1' paragraph className='leading-relaxed'>
        To be eligible for a return, the item must be unused, in its original packaging, and must include all authentic certificates, labels, and tags intact.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-4' style={{ color: '#006241' }}>
        2. Custom & Digital Products
      </Typography>
      <Typography variant='body1' paragraph className='leading-relaxed'>
        - <strong>Janam Kundli PDFs:</strong> Astrological charts compiled manually by Pandit ji are digital goods customized for your birth details. Therefore, they are <strong>strictly non-returnable and non-replaceable</strong>.<br/><br/>
        - <strong>Energized/Pran-Pratishtha Items:</strong> Products that undergo customized energetic rituals (Pran Pratishtha puja) specifically in the devotee&apos;s name cannot be returned.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-4' style={{ color: '#006241' }}>
        3. How to Initiate a Return
      </Typography>
      <Typography variant='body1' paragraph className='leading-relaxed'>
        Please capture clear photos of the damaged/defective product along with the package label and email them to <a href='mailto:returns@mandirsetuu.com' style={{ color: '#006241', textDecoration: 'underline' }}>returns@mandirsetuu.com</a>. Once approved, we will arrange a reverse pickup or provide courier return instructions.
      </Typography>
    </Container>
  )
}
