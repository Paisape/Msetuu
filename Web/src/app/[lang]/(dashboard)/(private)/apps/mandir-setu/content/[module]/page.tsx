// MUI Imports
import { notFound } from 'next/navigation'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// Lib Imports
import { getCurrentUser } from '@/libs/api-auth'

// Component Imports
import ContentManagementClient from '../ContentManagementClient'

type Props = {
  params: Promise<{ lang: string, module: string }>
}

const VALID_MODULES = [
  'banners',
  'shop-purposes',
  'chadhava-listings',
  'epuja-listings',
  'products',
  'categories',
  'kundli-listings',
  'astrologers',
  'jyotish-time-slots',
  'darshan-temples',
  'faqs',
  'how-it-works',
  'reviews'
]

const ContentManagementModulePage = async (props: Props) => {
  const params = await props.params
  const { module: slug } = params

  if (!VALID_MODULES.includes(slug)) {
    notFound()
  }

  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className='p-6'>
        <Card className='p-12 text-center'>
          <Typography variant='h5' className='font-bold mb-2'>
            Access denied
          </Typography>
          <Typography className='text-textSecondary'>
            This console is only available to Mandir Setu administrators.
          </Typography>
        </Card>
      </div>
    )
  }

  return <ContentManagementClient slug={slug} />
}

export default ContentManagementModulePage
