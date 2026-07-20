import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

import { getCurrentUser } from '@/libs/api-auth'

const AccessDenied = () => (
  <div className='p-6'>
    <Card className='p-12 text-center'>
      <Typography variant='h5' className='font-bold mb-2'>
        Access denied
      </Typography>
      <Typography className='text-textSecondary'>This page is only available to Mandirsetuu administrators.</Typography>
    </Card>
  </div>
)

// Call at the top of any admin server page: `const denied = await requireAdminOrDenied(); if (denied) return denied`.
export async function requireAdminOrDenied() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') return <AccessDenied />

  return null
}
