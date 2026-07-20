'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hooks Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
import styles from './styles.module.css'
import frontCommonStyles from '@views/front-pages/styles.module.css'

const Footer = ({ mode }: { mode: Mode }) => {
  // Vars
  const footerImageLight = '/images/front-pages/footer-bg-light.png'
  const footerImageDark = '/images/front-pages/footer-bg-dark.png'

  // Hooks
  const dashboardImage = useImageVariant(mode, footerImageLight, footerImageDark)

  return (
    <footer className={frontLayoutClasses.footer}>
      <div className='relative'>
        <img src={dashboardImage} alt='footer bg' className='absolute inset-0 is-full bs-full object-cover -z-[1]' />
        <div className={classnames('plb-12 text-white', frontCommonStyles.layoutSpacing)}>
          <Grid container rowSpacing={10} columnSpacing={12}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <div className='flex flex-col items-start gap-6'>
                <Link href='/front-pages/landing-page'>
                  <Logo color='var(--mui-palette-common-white)' />
                </Link>
                <Typography color='white' className='md:max-is-[390px] opacity-[0.78]'>
                  Mandirsetuu - Your sacred connection to E-Puja, Chadhava, Astrology consultations, and Handcrafted Kundli services.
                </Typography>
                <div className='flex items-end'>
                  <CustomTextField
                    size='small'
                    className={styles.inputBorder}
                    label='Subscribe to newsletter'
                    placeholder='Your email'
                    sx={{
                      '& .MuiInputBase-root': {
                        borderStartEndRadius: '0 !important',
                        borderEndEndRadius: '0 !important',
                        '&:not(.Mui-focused)': {
                          borderColor: 'rgb(var(--mui-mainColorChannels-dark) / 0.22)'
                        },
                        '&.MuiFilledInput-root:not(.Mui-focused):not(.Mui-disabled):hover': {
                          borderColor: 'rgba(255 255 255 / 0.6) !important'
                        }
                      }
                    }}
                  />
                  <Button
                    variant='contained'
                    color='primary'
                    sx={{
                      borderStartStartRadius: 0,
                      borderEndStartRadius: 0
                    }}
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 3, lg: 2 }}>
              <Typography color='white' className='font-medium mbe-6 opacity-[0.92]'>
                Services
              </Typography>
              <div className='flex flex-col gap-4'>
                <Typography component={Link} href='/front-pages/chadhava' color='white' className='opacity-[0.78]'>
                  Chadhava
                </Typography>
                <Typography component={Link} href='/front-pages/epuja' color='white' className='opacity-[0.78]'>
                  E-Puja
                </Typography>
                <Typography component={Link} href='/front-pages/jyotish' color='white' className='opacity-[0.78]'>
                  Jyotish Consulting
                </Typography>
                <Typography component={Link} href='/front-pages/kundli' color='white' className='opacity-[0.78]'>
                  Handcrafted Kundli
                </Typography>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 3, lg: 2 }}>
              <Typography color='white' className='font-medium mbe-6 opacity-[0.92]'>
                Quick Links
              </Typography>
              <div className='flex flex-col gap-4'>
                <Typography component={Link} href='/front-pages/ecommerce' color='white' className='opacity-[0.78]'>
                  E-Commerce Shop
                </Typography>
                <Typography component={Link} href='/front-pages/yatra' color='white' className='opacity-[0.78]'>
                  Yatra Booking
                </Typography>
                <Typography component={Link} href='/front-pages/about' color='white' className='opacity-[0.78]'>
                  About Us
                </Typography>
                <Typography component={Link} href='/front-pages/contact' color='white' className='opacity-[0.78]'>
                  Contact Us
                </Typography>
                <Typography component={Link} href='/front-pages/privacy-policy' color='white' className='opacity-[0.78]'>
                  Privacy Policy
                </Typography>
                <Typography component={Link} href='/front-pages/refund-policy' color='white' className='opacity-[0.78]'>
                  Refund Policy
                </Typography>
                <Typography component={Link} href='/front-pages/return-policy' color='white' className='opacity-[0.78]'>
                  Return Policy
                </Typography>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Typography color='white' className='font-medium mbe-6 opacity-[0.92]'>
                Download our App
              </Typography>
              <div className='flex flex-col gap-4'>
                <Link className='bg-[#282C3E] bs-[56px] is-[211px] rounded'>
                  <div className='flex items-center pli-5 plb-[7px] gap-6'>
                    <img src='/images/front-pages/apple-icon.png' alt='apple store' className='bs-[34px]' />
                    <div className='flex flex-col items-start'>
                      <Typography variant='body2' color='white' className='opacity-75'>
                        Download on the
                      </Typography>
                      <Typography color='white' className='font-medium opacity-[0.92]'>
                        App Store
                      </Typography>
                    </div>
                  </div>
                </Link>
                <Link className='bg-[#282C3E] bs-[56px] is-[211px] rounded'>
                  <div className='flex items-center pli-5 plb-[7px] gap-6'>
                    <img src='/images/front-pages/google-play-icon.png' alt='Google play' className='bs-[34px]' />
                    <div className='flex flex-col items-start'>
                      <Typography variant='body2' color='white' className='opacity-75'>
                        Download on the
                      </Typography>
                      <Typography color='white' className='font-medium opacity-[0.92]'>
                        Google Play
                      </Typography>
                    </div>
                  </div>
                </Link>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
      <div className='bg-[#211B2C]'>
        <div
          className={classnames(
            'flex flex-wrap items-center justify-center sm:justify-between gap-4 plb-[15px]',
            frontCommonStyles.layoutSpacing
          )}
        >
          <Typography className='text-white' variant='body2'>
            <span>{`© ${new Date().getFullYear()} Mandirsetuu. All rights reserved.`}</span>
          </Typography>
          <div className='flex gap-1.5 items-center'>
            <IconButton component={Link} size='small' href='https://github.com/pixinvent' target='_blank'>
              <i className='tabler-brand-github-filled text-white text-lg' />
            </IconButton>
            <IconButton component={Link} size='small' href='https://www.facebook.com/pixinvents/' target='_blank'>
              <i className='tabler-brand-facebook-filled text-white text-lg' />
            </IconButton>
            <IconButton component={Link} size='small' href='https://x.com/pixinvents' target='_blank'>
              <i className='tabler-brand-twitter-filled text-white text-lg' />
            </IconButton>
            <IconButton
              component={Link}
              size='small'
              href='https://www.youtube.com/channel/UClOcB3o1goJ293ri_Hxpklg'
              target='_blank'
            >
              <i className='tabler-brand-youtube-filled text-white text-lg' />
            </IconButton>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
