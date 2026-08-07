import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

export default function TermsAndConditions() {
  return (
    <Container maxWidth='md' className='py-16'>
      <Box className='mb-8'>
        <Typography variant='h3' component='h1' className='font-bold mb-4' style={{ color: '#006241' }}>
          Terms & Conditions
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Last updated: August 2026
        </Typography>
      </Box>

      <Typography variant='body1' paragraph>
        Welcome to MandirSetu. These terms and conditions outline the rules and regulations for the use of our application and services.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-2' style={{ color: '#006241' }}>
        1. Terms
      </Typography>
      <Typography variant='body1' paragraph>
        By accessing this application, you are agreeing to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-2' style={{ color: '#006241' }}>
        2. Use License
      </Typography>
      <Typography variant='body1' paragraph>
        Permission is granted to temporarily download one copy of the materials on MandirSetu's application for personal, non-commercial transitory viewing only.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-2' style={{ color: '#006241' }}>
        3. Disclaimer
      </Typography>
      <Typography variant='body1' paragraph>
        The materials on MandirSetu's application are provided on an 'as is' basis. MandirSetu makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
      </Typography>

      <Typography variant='h5' component='h2' className='font-bold mt-8 mb-2' style={{ color: '#006241' }}>
        4. Limitations
      </Typography>
      <Typography variant='body1' paragraph>
        In no event shall MandirSetu or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MandirSetu's application.
      </Typography>
    </Container>
  )
}
